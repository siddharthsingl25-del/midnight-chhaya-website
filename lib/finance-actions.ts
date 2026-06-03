/**
 * Server-side finance primitives — pure data functions shared between
 * the admin API routes and the Telegram bot webhook. Both call the same
 * code so the numbers can't drift apart.
 *
 * Every function here assumes the caller has already authorised the
 * request (admin cookie OR Telegram owner-id check).
 */

import { revalidateTag } from "next/cache";
import { supabaseAdmin } from "./supabase";
import { getAllProducts, getChain } from "./catalog";
import { computeShipping } from "./site";
import {
  EXPENSE_CATEGORIES,
  type ExpenseCategory,
  type Product,
} from "./types";

const RAZORPAY_FEE_RATE = 0.02;

/* ─── Cash sales ─────────────────────────────────────────────────────── */

export type CashSaleInput = {
  items: Array<{ slug: string; qty: number; chainId?: string }>;
  customerName?: string;
  customerPhone?: string;
  customerInstagram?: string;
  merchantCost?: number | null;
  occurredAt?: string;
  notes?: string;
  chargeShipping?: boolean;
};

export type CashSaleResult = {
  orderNumber: string;
  id: number;
  total: number;
  subtotal: number;
  shipping: number;
  cogs: number;
  profit: number;
  itemSummary: string;
};

export async function logCashSale(input: CashSaleInput): Promise<CashSaleResult> {
  if (input.items.length === 0) throw new Error("No items");

  const products = await getAllProducts();
  const lines: {
    slug: string;
    name: string;
    qty: number;
    chainId: string | null;
    chainName: string | null;
    unitInr: number;
    /** Combined product + chain cost per unit. Null if either cost is
     * unset — we can't compute partial COGS without misleading the user. */
    costInr: number | null;
  }[] = [];

  for (const it of input.items) {
    if (typeof it.slug !== "string" || typeof it.qty !== "number" || it.qty <= 0) {
      throw new Error("Bad item");
    }
    const product = products.find((p) => p.slug === it.slug);
    if (!product || product.price == null) {
      throw new Error(`Unavailable: ${it.slug}`);
    }
    const chain = it.chainId ? await getChain(it.chainId) : null;
    // Combined unit cost = product cost + chain cost (if applicable).
    // If either side is missing, the combined cost is null and per-sale
    // profit shows as "n/a" in the Telegram reply.
    let combinedCost: number | null = product.costPrice;
    if (chain) {
      if (combinedCost != null && chain.costPrice != null) {
        combinedCost = combinedCost + chain.costPrice;
      } else {
        combinedCost = null;
      }
    }
    lines.push({
      slug: it.slug,
      name: product.name,
      qty: it.qty,
      chainId: chain?.id ?? null,
      chainName: chain?.name ?? null,
      unitInr: product.price + (chain?.priceModifier ?? 0),
      costInr: combinedCost,
    });
  }

  const subtotal = lines.reduce((s, l) => s + l.unitInr * l.qty, 0);
  const shipping = input.chargeShipping ? computeShipping(subtotal) : 0;
  const total = subtotal + shipping;

  const sb = supabaseAdmin();

  for (const { slug, qty } of lines) {
    const { error } = await sb.rpc("decrement_stock", {
      p_slug: slug,
      p_qty: qty,
    });
    if (error) throw new Error(`Stock issue on ${slug}: ${error.message}`);
  }
  const chainQty = new Map<string, number>();
  for (const l of lines) {
    if (!l.chainId) continue;
    chainQty.set(l.chainId, (chainQty.get(l.chainId) ?? 0) + l.qty);
  }
  for (const [id, qty] of chainQty) {
    const { error } = await sb.rpc("decrement_chain_stock", {
      p_chain_id: id,
      p_qty: qty,
    });
    if (error) throw new Error(`Chain stock issue: ${error.message}`);
  }

  const merchantCost =
    input.merchantCost === null || input.merchantCost === undefined
      ? null
      : Math.max(0, Math.round(Number(input.merchantCost)));

  const createdAt =
    typeof input.occurredAt === "string" && input.occurredAt.trim()
      ? new Date(input.occurredAt).toISOString()
      : new Date().toISOString();

  const { data, error } = await sb
    .from("orders")
    .insert({
      razorpay_payment_id: null,
      razorpay_order_id: null,
      payment_method: "cash",
      customer_name: (input.customerName ?? "Cash sale").slice(0, 120),
      customer_email: "",
      customer_phone: (input.customerPhone ?? "").slice(0, 30),
      customer_instagram: (input.customerInstagram ?? "").slice(0, 60),
      delivery_address: "",
      items: lines.map((l) => ({
        slug: l.slug,
        name: l.name,
        qty: l.qty,
        chainId: l.chainId,
        chainName: l.chainName,
        unitPrice: l.unitInr,
      })),
      subtotal: Math.round(subtotal),
      shipping: Math.round(shipping),
      total: Math.round(total),
      merchant_cost: merchantCost,
      notes: (input.notes ?? "").slice(0, 500),
      created_at: createdAt,
      updated_at: createdAt,
    })
    .select("order_number, id")
    .single();
  if (error) throw new Error(error.message);

  // Profit on the cash sale: no gateway fee, no shipping pass-through cost,
  // shipping NOT counted in revenue either (it pays the courier).
  let cogs = 0;
  let hasMissingCost = false;
  for (const l of lines) {
    if (l.costInr == null) hasMissingCost = true;
    else cogs += l.costInr * l.qty;
  }
  const profit = subtotal - cogs - (merchantCost ?? 0);

  revalidateTag("products", "max");

  return {
    orderNumber: data!.order_number as string,
    id: data!.id as number,
    total: Math.round(total),
    subtotal: Math.round(subtotal),
    shipping: Math.round(shipping),
    cogs: hasMissingCost ? -1 : Math.round(cogs),
    profit: hasMissingCost ? -1 : Math.round(profit),
    itemSummary: lines.map((l) => `${l.name} ×${l.qty}`).join(", "),
  };
}

/* ─── Expenses ───────────────────────────────────────────────────────── */

export type LogExpenseInput = {
  category: ExpenseCategory;
  amount: number;
  description?: string;
  occurredAt?: string;
};

export async function logExpense(input: LogExpenseInput): Promise<{ id: number }> {
  if (!EXPENSE_CATEGORIES.includes(input.category)) {
    throw new Error("Bad category");
  }
  if (!Number.isFinite(input.amount) || input.amount < 0) {
    throw new Error("Bad amount");
  }

  const { data, error } = await supabaseAdmin()
    .from("expenses")
    .insert({
      category: input.category,
      amount: Math.round(input.amount),
      description: (input.description ?? "").trim().slice(0, 280),
      occurred_at:
        input.occurredAt && input.occurredAt.trim()
          ? input.occurredAt.trim()
          : new Date().toISOString().slice(0, 10),
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return { id: data!.id as number };
}

/* ─── Stats for a date window ────────────────────────────────────────── */

export type RangeStats = {
  revenue: number;
  cogs: number;
  gatewayFees: number;
  merchantCost: number;
  grossProfit: number;
  expensesTotal: number;
  netProfit: number;
  orderCount: number;
  cashOrderCount: number;
  onlineOrderCount: number;
};

export async function getStatsForRange(
  fromIso: string,
  toIso: string
): Promise<RangeStats> {
  const sb = supabaseAdmin();
  const [ordersRes, productsRes, chainsRes, expensesRes] = await Promise.all([
    sb
      .from("orders")
      .select("payment_method, items, subtotal, shipping, total, merchant_cost")
      .neq("status", "cancelled")
      .gte("created_at", fromIso)
      .lt("created_at", toIso),
    sb.from("products").select("slug, cost_price"),
    sb.from("chain_options").select("id, cost_price"),
    sb
      .from("expenses")
      .select("amount")
      .gte("occurred_at", fromIso.slice(0, 10))
      .lt("occurred_at", toIso.slice(0, 10)),
  ]);

  if (ordersRes.error) throw new Error(ordersRes.error.message);
  if (productsRes.error) throw new Error(productsRes.error.message);
  if (chainsRes.error) throw new Error(chainsRes.error.message);
  if (expensesRes.error) throw new Error(expensesRes.error.message);

  const costBySlug = new Map<string, number | null>();
  for (const p of productsRes.data ?? []) {
    costBySlug.set(p.slug as string, (p.cost_price as number | null) ?? null);
  }
  const costByChain = new Map<string, number | null>();
  for (const c of chainsRes.data ?? []) {
    costByChain.set(c.id as string, (c.cost_price as number | null) ?? null);
  }

  let revenue = 0;
  let cogs = 0;
  let gatewayFees = 0;
  let merchantCost = 0;
  let cashOrderCount = 0;
  let onlineOrderCount = 0;
  const orderRows = (ordersRes.data ?? []) as Array<{
    payment_method: "online" | "cash";
    items: Array<{ slug: string; qty: number; chainId?: string | null }>;
    subtotal: number;
    shipping: number;
    total: number;
    merchant_cost: number | null;
  }>;
  for (const o of orderRows) {
    // Shipping that the customer paid is real revenue — it covers (or
    // partially covers) the courier bill. Courier cost is logged
    // separately as merchant_cost per order or as a 'shipping' expense
    // line so it nets out correctly.
    revenue += o.total;
    merchantCost += o.merchant_cost ?? 0;
    if (o.payment_method === "online") {
      gatewayFees += Math.round(o.total * RAZORPAY_FEE_RATE);
      onlineOrderCount++;
    } else {
      cashOrderCount++;
    }
    for (const it of o.items ?? []) {
      const c = costBySlug.get(it.slug);
      if (c != null) cogs += c * (it.qty ?? 0);
      if (it.chainId) {
        const cc = costByChain.get(it.chainId);
        if (cc != null) cogs += cc * (it.qty ?? 0);
      }
    }
  }

  const expensesTotal = (expensesRes.data ?? []).reduce(
    (s, e) => s + (e.amount as number),
    0
  );
  const grossProfit = revenue - cogs - gatewayFees - merchantCost;
  const netProfit = grossProfit - expensesTotal;

  return {
    revenue: Math.round(revenue),
    cogs: Math.round(cogs),
    gatewayFees: Math.round(gatewayFees),
    merchantCost: Math.round(merchantCost),
    grossProfit: Math.round(grossProfit),
    expensesTotal: Math.round(expensesTotal),
    netProfit: Math.round(netProfit),
    orderCount: orderRows.length,
    cashOrderCount,
    onlineOrderCount,
  };
}

/* ─── Product lookup helpers ─────────────────────────────────────────── */

/**
 * Fuzzy-find a product by slug substring, name substring, or first-letter
 * matches. Designed for the Telegram bot where you type "monster" and
 * expect to hit "monster-keychain". Returns a single match if it's
 * unambiguous, or the candidate list if multiple matches.
 */
export async function findProductByQuery(
  query: string
): Promise<{ exact: Product | null; candidates: Product[] }> {
  const q = query.trim().toLowerCase();
  if (!q) return { exact: null, candidates: [] };
  const all = await getAllProducts();

  // 1. Exact slug match
  const exactSlug = all.find((p) => p.slug.toLowerCase() === q);
  if (exactSlug) return { exact: exactSlug, candidates: [exactSlug] };

  // 2. Substring matches on slug or name
  const sub = all.filter(
    (p) =>
      p.slug.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
  );
  if (sub.length === 1) return { exact: sub[0], candidates: sub };
  if (sub.length > 1) return { exact: null, candidates: sub.slice(0, 8) };

  return { exact: null, candidates: [] };
}

export async function getLowStock(threshold = 5): Promise<
  Array<{ slug: string; name: string; stock: number }>
> {
  const sb = supabaseAdmin();
  const [products, stock] = await Promise.all([
    getAllProducts(),
    sb.from("inventory").select("slug, stock"),
  ]);
  if (stock.error) throw new Error(stock.error.message);
  const map = new Map(
    (stock.data ?? []).map((r) => [r.slug as string, r.stock as number])
  );
  return products
    .map((p) => ({ slug: p.slug, name: p.name, stock: map.get(p.slug) ?? 0 }))
    .filter((r) => r.stock <= threshold)
    .sort((a, b) => a.stock - b.stock);
}

export async function getStockBySlug(slug: string): Promise<number | null> {
  const { data } = await supabaseAdmin()
    .from("inventory")
    .select("stock")
    .eq("slug", slug)
    .maybeSingle();
  return (data?.stock as number | undefined) ?? null;
}

/* ─── Expense category alias resolver (for the bot) ──────────────────── */

const EXPENSE_ALIASES: Record<string, ExpenseCategory> = {
  ad: "advertising",
  ads: "advertising",
  advertising: "advertising",
  advert: "advertising",
  marketing: "advertising",
  collab: "collab",
  influencer: "collab",
  pr: "collab",
  restock: "restock",
  raw: "restock",
  materials: "restock",
  stock: "restock",
  ship: "shipping",
  shipping: "shipping",
  courier: "shipping",
  pack: "packaging",
  packaging: "packaging",
  box: "packaging",
  other: "other",
  misc: "other",
};

export function resolveExpenseCategory(token: string): ExpenseCategory | null {
  const k = token.trim().toLowerCase();
  return EXPENSE_ALIASES[k] ?? null;
}

/* ─── Per-order courier cost (for /ship) ─────────────────────────────── */

export async function setOrderMerchantCost(
  orderNumber: string,
  amount: number
): Promise<{ orderNumber: string; previousCost: number | null }> {
  const sb = supabaseAdmin();
  const normalised = orderNumber.trim().toUpperCase();
  const withPrefix = normalised.startsWith("MC-") ? normalised : `MC-${normalised}`;
  const { data, error } = await sb
    .from("orders")
    .select("id, order_number, merchant_cost")
    .eq("order_number", withPrefix)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error(`Order ${withPrefix} not found`);
  const previous = (data.merchant_cost as number | null) ?? null;
  const { error: upErr } = await sb
    .from("orders")
    .update({
      merchant_cost: Math.max(0, Math.round(amount)),
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.id);
  if (upErr) throw new Error(upErr.message);
  return { orderNumber: data.order_number as string, previousCost: previous };
}

/* ─── Delete an order by number (for /delete) ────────────────────────── */

export async function deleteOrder(orderRef: string): Promise<{
  orderNumber: string;
  total: number;
  itemSummary: string;
} | null> {
  const sb = supabaseAdmin();
  const normalised = orderRef.trim().toUpperCase();
  const withPrefix = normalised.startsWith("MC-") ? normalised : `MC-${normalised}`;
  const { data: order } = await sb
    .from("orders")
    .select("id, order_number, items, total")
    .eq("order_number", withPrefix)
    .maybeSingle();
  if (!order) return null;

  const items = (order.items as Array<{
    slug: string;
    qty: number;
    chainId?: string | null;
  }>) ?? [];
  for (const it of items) {
    const { data: inv } = await sb
      .from("inventory")
      .select("stock")
      .eq("slug", it.slug)
      .maybeSingle();
    const next = (inv?.stock ?? 0) + (it.qty ?? 0);
    await sb
      .from("inventory")
      .upsert({ slug: it.slug, stock: next, updated_at: new Date().toISOString() });
    if (it.chainId) {
      const { data: ch } = await sb
        .from("chain_options")
        .select("stock")
        .eq("id", it.chainId)
        .maybeSingle();
      const nextCh = (ch?.stock ?? 0) + (it.qty ?? 0);
      await sb
        .from("chain_options")
        .update({ stock: nextCh, updated_at: new Date().toISOString() })
        .eq("id", it.chainId);
    }
  }

  await sb.from("orders").delete().eq("id", order.id);
  revalidateTag("products", "max");

  return {
    orderNumber: order.order_number as string,
    total: order.total as number,
    itemSummary: items.map((it) => `${it.slug} ×${it.qty}`).join(", "),
  };
}

/* ─── Delete most recent cash order (for /undo) ──────────────────────── */

export async function undoLastCashOrder(): Promise<{
  orderNumber: string;
  itemSummary: string;
  total: number;
} | null> {
  const sb = supabaseAdmin();
  const { data: last } = await sb
    .from("orders")
    .select("id, order_number, items, total")
    .eq("payment_method", "cash")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!last) return null;

  // Restore stock for each line.
  const items = (last.items as Array<{ slug: string; qty: number; chainId?: string | null }>) ?? [];
  for (const it of items) {
    const { data: inv } = await sb
      .from("inventory")
      .select("stock")
      .eq("slug", it.slug)
      .maybeSingle();
    const next = (inv?.stock ?? 0) + (it.qty ?? 0);
    await sb
      .from("inventory")
      .upsert({ slug: it.slug, stock: next, updated_at: new Date().toISOString() });
    if (it.chainId) {
      const { data: ch } = await sb
        .from("chain_options")
        .select("stock")
        .eq("id", it.chainId)
        .maybeSingle();
      const nextCh = (ch?.stock ?? 0) + (it.qty ?? 0);
      await sb
        .from("chain_options")
        .update({ stock: nextCh, updated_at: new Date().toISOString() })
        .eq("id", it.chainId);
    }
  }

  await sb.from("orders").delete().eq("id", last.id);
  revalidateTag("products", "max");

  const summary = items.map((it: { slug: string; qty: number }) => `${it.slug} ×${it.qty}`).join(", ");
  return {
    orderNumber: last.order_number as string,
    itemSummary: summary,
    total: last.total as number,
  };
}
