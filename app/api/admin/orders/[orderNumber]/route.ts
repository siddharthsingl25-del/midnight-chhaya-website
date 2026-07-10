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
import { sendOrderShippedEmail, sendOrderDeliveredEmail } from "@/lib/notifications";
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

/**
 * PATCH /api/admin/orders/[orderNumber]
 *
 * Update the status of an order. Body:
 *   {
 *     status: "paid" | "shipped" | "delivered" | "refunded" | "cancelled",
 *     tracking_id?: string,
 *     courier_partner?: string,
 *     tracking_url?: string,
 *     send_email?: boolean   (defaults to true)
 *   }
 *
 * On status = 'shipped' → sends the shipping email with tracking info.
 * On status = 'delivered' → sends the delivered email.
 * send_email=false lets the merchant flip status without notifying (e.g.
 * marking a cash sale delivered retroactively).
 */

const ALLOWED_STATUSES = new Set([
  "paid",
  "shipped",
  "delivered",
  "refunded",
  "cancelled",
]);

export async function PATCH(req: Request, { params }: Params) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { orderNumber } = await params;
  const ref = decodeURIComponent(orderNumber).trim().toUpperCase();
  const withPrefix = ref.startsWith("MC-") ? ref : `MC-${ref}`;

  const body = (await req.json().catch(() => ({}))) as {
    status?: string;
    tracking_id?: string | null;
    courier_partner?: string | null;
    tracking_url?: string | null;
    send_email?: boolean;
  };
  const status = String(body.status ?? "").trim();
  if (!ALLOWED_STATUSES.has(status)) {
    return NextResponse.json({ error: "Bad status" }, { status: 400 });
  }

  const sb = supabaseAdmin();
  const { data: order, error: fetchErr } = await sb
    .from("orders")
    .select("*")
    .eq("order_number", withPrefix)
    .maybeSingle();
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!order) return NextResponse.json({ error: `Order ${withPrefix} not found` }, { status: 404 });

  const patch: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (typeof body.tracking_id === "string") patch.tracking_id = body.tracking_id.trim() || null;
  else if (body.tracking_id === null) patch.tracking_id = null;
  if (typeof body.courier_partner === "string")
    patch.courier_partner = body.courier_partner.trim() || null;
  else if (body.courier_partner === null) patch.courier_partner = null;
  if (typeof body.tracking_url === "string")
    patch.tracking_url = body.tracking_url.trim() || null;
  else if (body.tracking_url === null) patch.tracking_url = null;

  if (status === "shipped" && !order.shipped_at) {
    patch.shipped_at = new Date().toISOString();
  }
  if (status === "delivered" && !order.delivered_at) {
    patch.delivered_at = new Date().toISOString();
  }

  const { error: upErr } = await sb.from("orders").update(patch).eq("id", order.id);
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  // Send the customer-facing email unless the merchant opted out.
  const sendEmail = body.send_email !== false;
  const emailReport: { attempted: boolean; ok?: boolean; skipped?: boolean; error?: string } = {
    attempted: false,
  };
  if (sendEmail && order.customer_email) {
    const snapshot = {
      orderNumber: withPrefix,
      customer: {
        name: order.customer_name ?? "",
        email: order.customer_email ?? "",
        phone: order.customer_phone ?? "",
      },
      items: (order.items as Array<{ name: string; qty: number; chainName?: string | null; unitPrice: number }>) ?? [],
      subtotal: order.subtotal ?? 0,
      shipping: order.shipping ?? 0,
      total: order.total ?? 0,
      address: order.delivery_address ?? "",
      paymentId: order.razorpay_payment_id ?? withPrefix,
    };
    if (status === "shipped") {
      emailReport.attempted = true;
      const res = await sendOrderShippedEmail(snapshot, {
        trackingId: (patch.tracking_id as string | null) ?? order.tracking_id,
        courierPartner: (patch.courier_partner as string | null) ?? order.courier_partner,
        trackingUrl: (patch.tracking_url as string | null) ?? order.tracking_url,
      });
      Object.assign(emailReport, res);
    } else if (status === "delivered") {
      emailReport.attempted = true;
      const res = await sendOrderDeliveredEmail(snapshot);
      Object.assign(emailReport, res);
    }
  }

  return NextResponse.json({
    ok: true,
    orderNumber: withPrefix,
    status,
    email: emailReport,
  });
}
