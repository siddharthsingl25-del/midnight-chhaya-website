/**
 * GET /api/admin/finance
 *
 * Computes the P&L numbers for the admin dashboard in one shot — every
 * order with its per-line COGS resolved against the live product
 * cost_price, plus expenses summed by category. The client only has to
 * render the result.
 *
 * Profit per order = total − shipping(passed-through) − COGS − merchant_cost
 *                    − razorpay_fee(2% online, 0 cash)
 *
 * Shipping is treated as pass-through revenue: the customer pays the
 * courier rate, the merchant pays the courier (logged separately on
 * `merchant_cost`). Including shipping in revenue but not subtracting
 * the actual courier cost would inflate profit, so we exclude both by
 * subtracting shipping from total.
 *
 * Razorpay's standard rate is ~2% on online payments. Cash sales have
 * no gateway fee.
 */

import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabase";
import { EXPENSE_CATEGORIES, type ExpenseCategory } from "@/lib/types";
import {
  OPERATING_EXPENSE_CATEGORIES,
  PACKAGING_COST_PER_ORDER,
} from "@/lib/site";

const RAZORPAY_FEE_RATE = 0.02; // 2% for online payments

type OrderRow = {
  id: number;
  order_number: string;
  created_at: string;
  customer_name: string;
  customer_instagram: string;
  payment_method: "online" | "cash" | "cod";
  prepaid_amount: number | null;
  items: Array<{
    slug: string;
    name: string;
    qty: number;
    chainId?: string | null;
    chainName?: string | null;
    unitPrice: number;
  }>;
  subtotal: number;
  shipping: number;
  total: number;
  merchant_cost: number | null;
  packaging_cost: number | null;
  status: string;
};

type ProductCostRow = { slug: string; cost_price: number | null };

export async function GET(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const url = new URL(req.url);
  const limit = Math.min(500, Math.max(1, Number(url.searchParams.get("limit") ?? "200")));

  const sb = supabaseAdmin();

  const [ordersRes, productsRes, chainsRes, expensesRes] = await Promise.all([
    sb
      .from("orders")
      .select(
        "id, order_number, created_at, customer_name, customer_instagram, payment_method, prepaid_amount, items, subtotal, shipping, total, merchant_cost, packaging_cost, status"
      )
      .neq("status", "cancelled")
      .order("created_at", { ascending: false })
      .limit(limit),
    sb.from("products").select("slug, cost_price"),
    sb.from("chain_options").select("id, cost_price"),
    sb
      .from("expenses")
      .select("*")
      .order("occurred_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(500),
  ]);

  if (ordersRes.error)
    return NextResponse.json({ error: ordersRes.error.message }, { status: 500 });
  if (productsRes.error)
    return NextResponse.json({ error: productsRes.error.message }, { status: 500 });
  if (chainsRes.error)
    return NextResponse.json({ error: chainsRes.error.message }, { status: 500 });
  if (expensesRes.error)
    return NextResponse.json({ error: expensesRes.error.message }, { status: 500 });

  const costBySlug = new Map<string, number | null>();
  for (const p of (productsRes.data ?? []) as ProductCostRow[]) {
    costBySlug.set(p.slug, p.cost_price);
  }
  const costByChain = new Map<string, number | null>();
  for (const c of (chainsRes.data ?? []) as Array<{ id: string; cost_price: number | null }>) {
    costByChain.set(c.id, c.cost_price);
  }

  // Per-order P&L
  const orders = ((ordersRes.data ?? []) as OrderRow[]).map((o) => {
    const items = Array.isArray(o.items) ? o.items : [];
    let cogs = 0;
    let hasMissingCost = false;
    for (const it of items) {
      const c = costBySlug.get(it.slug);
      if (c == null) {
        hasMissingCost = true;
      } else {
        cogs += c * (it.qty ?? 0);
      }
      // Chain on this line carries its own cost. If the chain has no
      // cost_price set yet, silently skip — flagging it as 'missing' on
      // every chain order would be too noisy until the merchant fills
      // them all in.
      if (it.chainId) {
        const cc = costByChain.get(it.chainId);
        if (cc != null) cogs += cc * (it.qty ?? 0);
      }
    }
    const merchantCost = o.merchant_cost ?? 0;
    const gatewayFee =
      o.payment_method === "cash"
        ? 0
        : Math.round((o.prepaid_amount ?? o.total) * RAZORPAY_FEE_RATE);
    // Shipping the customer paid is real revenue. Courier cost lives
    // on merchant_cost (set via /ship or the cash form). Packaging is
    // per-order: order.packaging_cost overrides the global default
    // when set (e.g. 0 for hand-off cash sales).
    const packagingCost = o.packaging_cost ?? PACKAGING_COST_PER_ORDER;
    const netRevenue = o.total - gatewayFee;
    const profit = netRevenue - cogs - merchantCost - packagingCost;
    return {
      id: o.id,
      orderNumber: o.order_number,
      createdAt: o.created_at,
      customerName: o.customer_name,
      customerInstagram: o.customer_instagram,
      paymentMethod: o.payment_method,
      items,
      subtotal: o.subtotal,
      shipping: o.shipping,
      total: o.total,
      merchantCost,
      packagingCost,
      gatewayFee,
      cogs,
      netRevenue,
      profit,
      hasMissingCost,
      status: o.status,
    };
  });

  // Month aggregates (current calendar month, IST)
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const monthOrders = orders.filter(
    (o) => new Date(o.createdAt).getTime() >= monthStart
  );
  const monthRevenue = monthOrders.reduce((s, o) => s + o.total, 0);
  const monthCogs = monthOrders.reduce((s, o) => s + o.cogs, 0);
  const monthGatewayFees = monthOrders.reduce((s, o) => s + o.gatewayFee, 0);
  const monthMerchantCost = monthOrders.reduce((s, o) => s + o.merchantCost, 0);
  const monthGrossProfit = monthOrders.reduce((s, o) => s + o.profit, 0);

  // All-time aggregates
  const allRevenue = orders.reduce((s, o) => s + o.total, 0);
  const allCogs = orders.reduce((s, o) => s + o.cogs, 0);
  const allGrossProfit = orders.reduce((s, o) => s + o.profit, 0);

  // Expenses
  const expenses = (expensesRes.data ?? []).map((e) => ({
    id: e.id as number,
    category: e.category as ExpenseCategory,
    amount: e.amount as number,
    description: (e.description as string) ?? "",
    occurredAt: e.occurred_at as string,
    createdAt: e.created_at as string,
  }));

  const monthExpensesByCategory: Record<ExpenseCategory, number> = {
    advertising: 0,
    collab: 0,
    restock: 0,
    shipping: 0,
    packaging: 0,
    other: 0,
  };
  const operatingSet = new Set<string>(OPERATING_EXPENSE_CATEGORIES);
  let monthOperatingExpenses = 0;
  let monthTrackingSpend = 0;
  let allOperatingExpenses = 0;
  let allTrackingSpend = 0;
  for (const e of expenses) {
    const occ = new Date(e.occurredAt).getTime();
    const isOperating = operatingSet.has(e.category);
    if (EXPENSE_CATEGORIES.includes(e.category)) {
      if (isOperating) allOperatingExpenses += e.amount;
      else allTrackingSpend += e.amount;
      if (occ >= monthStart) {
        monthExpensesByCategory[e.category] += e.amount;
        if (isOperating) monthOperatingExpenses += e.amount;
        else monthTrackingSpend += e.amount;
      }
    }
  }

  const monthPackagingCost = monthOrders.reduce(
    (s, o) => s + o.packagingCost,
    0
  );
  const allPackagingCost = orders.reduce((s, o) => s + o.packagingCost, 0);

  return NextResponse.json({
    orders,
    expenses,
    month: {
      revenue: monthRevenue,
      cogs: monthCogs,
      gatewayFees: monthGatewayFees,
      merchantCost: monthMerchantCost,
      packagingCost: monthPackagingCost,
      grossProfit: monthGrossProfit,
      expensesTotal: monthOperatingExpenses,
      trackingSpend: monthTrackingSpend,
      expensesByCategory: monthExpensesByCategory,
      netProfit: monthGrossProfit - monthOperatingExpenses,
      orderCount: monthOrders.length,
    },
    allTime: {
      revenue: allRevenue,
      cogs: allCogs,
      packagingCost: allPackagingCost,
      grossProfit: allGrossProfit,
      expensesTotal: allOperatingExpenses,
      trackingSpend: allTrackingSpend,
      netProfit: allGrossProfit - allOperatingExpenses,
      orderCount: orders.length,
    },
  });
}
