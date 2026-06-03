/**
 * DELETE /api/admin/orders/[orderNumber]
 *
 * Removes an order row. Restores the inventory it consumed (both product
 * stock and any chain stock) so a bad/test order doesn't leave inventory
 * out of sync.
 *
 * Note: this does NOT refund the customer. For real Razorpay refunds use
 * the Razorpay dashboard. Use this for test orders, duplicates, or cash
 * sales you mis-logged.
 */

import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { isAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabase";

type Params = { params: Promise<{ orderNumber: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { orderNumber } = await params;
  const ref = decodeURIComponent(orderNumber).trim().toUpperCase();
  const withPrefix = ref.startsWith("MC-") ? ref : `MC-${ref}`;

  const sb = supabaseAdmin();
  const { data: order, error: fetchErr } = await sb
    .from("orders")
    .select("id, order_number, items, total")
    .eq("order_number", withPrefix)
    .maybeSingle();
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!order) {
    return NextResponse.json({ error: `Order ${withPrefix} not found` }, { status: 404 });
  }

  // Restore stock for every line.
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

  const { error: delErr } = await sb.from("orders").delete().eq("id", order.id);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  revalidateTag("products", "max");

  return NextResponse.json({
    ok: true,
    orderNumber: order.order_number,
    restoredStock: items.length,
  });
}
