/**
 * POST /api/admin/cash-orders
 *
 * Records a manual / cash sale (e.g. a friend paying in person). It
 * lands in the SAME `orders` table as online sales, so the finance
 * dashboard sums both into one ledger.
 *
 * Body:
 *   {
 *     customer_name, customer_phone?, customer_instagram?,
 *     items: [{ slug, qty, chainId? }],
 *     merchant_cost?: number,         // optional override of cost basis
 *     occurred_at?: string,           // ISO date, defaults to today
 *     notes?: string,
 *   }
 *
 * The server resolves prices + product names from the live catalog so
 * the merchant can't fat-finger them. Stock is decremented for every
 * line (cash sales eat inventory just like online sales).
 */

import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { isAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabase";
import { getAllProducts, getChain } from "@/lib/catalog";
import { computeShipping } from "@/lib/site";

type IncomingItem = { slug: string; qty: number; chainId?: string };
type Body = {
  customer_name?: string;
  customer_phone?: string;
  customer_instagram?: string;
  items: IncomingItem[];
  merchant_cost?: number | null;
  occurred_at?: string;
  notes?: string;
  /** Whether to charge shipping on this manual sale (default: false,
   * since most cash sales are hand-off). */
  charge_shipping?: boolean;
};

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) {
    return NextResponse.json({ error: "No items" }, { status: 400 });
  }

  const products = await getAllProducts();
  const lines: {
    slug: string;
    name: string;
    qty: number;
    chainId: string | null;
    chainName: string | null;
    unitInr: number;
  }[] = [];
  for (const it of items) {
    if (typeof it.slug !== "string" || typeof it.qty !== "number" || it.qty <= 0) {
      return NextResponse.json({ error: "Bad item" }, { status: 400 });
    }
    const product = products.find((p) => p.slug === it.slug);
    if (!product || product.price == null) {
      return NextResponse.json({ error: `Unavailable: ${it.slug}` }, { status: 400 });
    }
    const chain = it.chainId ? await getChain(it.chainId) : null;
    lines.push({
      slug: it.slug,
      name: product.name,
      qty: it.qty,
      chainId: chain?.id ?? null,
      chainName: chain?.name ?? null,
      unitInr: product.price + (chain?.priceModifier ?? 0),
    });
  }

  const subtotal = lines.reduce((s, l) => s + l.unitInr * l.qty, 0);
  const shipping = body.charge_shipping ? computeShipping(subtotal) : 0;
  const total = subtotal + shipping;

  const sb = supabaseAdmin();

  // Decrement product + chain inventory so cash sales reduce stock too.
  for (const { slug, qty } of lines) {
    const { error } = await sb.rpc("decrement_stock", {
      p_slug: slug,
      p_qty: qty,
    });
    if (error) {
      return NextResponse.json(
        { error: `Stock issue on ${slug}: ${error.message}` },
        { status: 409 }
      );
    }
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
    if (error) {
      return NextResponse.json(
        { error: `Chain stock issue on ${id}: ${error.message}` },
        { status: 409 }
      );
    }
  }

  const merchantCost =
    body.merchant_cost === null || body.merchant_cost === undefined
      ? null
      : Math.max(0, Math.round(Number(body.merchant_cost)));

  const createdAt =
    typeof body.occurred_at === "string" && body.occurred_at.trim()
      ? new Date(body.occurred_at).toISOString()
      : new Date().toISOString();

  const { data, error } = await sb
    .from("orders")
    .insert({
      razorpay_payment_id: null,
      razorpay_order_id: null,
      payment_method: "cash",
      customer_name: (body.customer_name ?? "Cash sale").slice(0, 120),
      customer_email: "",
      customer_phone: (body.customer_phone ?? "").slice(0, 30),
      customer_instagram: (body.customer_instagram ?? "").slice(0, 60),
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
      notes: (body.notes ?? "").slice(0, 500),
      created_at: createdAt,
      updated_at: createdAt,
    })
    .select("order_number, id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Stock changed → flush product cache for the storefront.
  revalidateTag("products", "max");
  return NextResponse.json({ ok: true, orderNumber: data?.order_number, id: data?.id });
}
