/**
 * GET /api/admin/orders/labels?status=paid
 *
 * Bulk print-ready HTML shipping labels — A4, 4 labels (2×2) per sheet,
 * each 9×9 cm. Auto-triggers browser print dialog on load.
 *
 * Query params:
 *   status=paid|shipped|delivered  (defaults to paid — the usual "new
 *                                   orders ready to pack" queue)
 *   orders=MC-0001,MC-0002         (explicit list, overrides status)
 *
 * Sorted oldest-first so you pack in FIFO order.
 */

import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabase";
import { renderLabelPage, type LabelOrder } from "@/lib/shippingLabel";

const ALLOWED_STATUS = new Set(["paid", "shipped", "delivered"]);

export async function GET(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const url = new URL(req.url);
  const status = (url.searchParams.get("status") ?? "paid").toLowerCase();
  const ordersParam = url.searchParams.get("orders");

  const sb = supabaseAdmin();
  let query = sb
    .from("orders")
    .select(
      "order_number, customer_name, customer_phone, delivery_address, payment_method, total, created_at"
    )
    .order("created_at", { ascending: true });

  if (ordersParam) {
    const list = ordersParam
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .map((s) => (s.startsWith("MC-") ? s : `MC-${s}`))
      .filter(Boolean);
    query = query.in("order_number", list);
  } else if (ALLOWED_STATUS.has(status)) {
    query = query.eq("status", status);
  } else {
    return NextResponse.json({ error: "Bad status" }, { status: 400 });
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const orders = (data ?? []) as LabelOrder[];
  if (orders.length === 0) {
    return new NextResponse(
      `<!doctype html><meta charset="utf-8"><title>No labels</title>
       <body style="font-family:sans-serif;padding:40px;text-align:center;color:#333;">
         <h2>No orders to print</h2>
         <p>No ${status} orders found. Nothing to label.</p>
       </body>`,
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const title = ordersParam
    ? `Labels · ${orders.length} selected`
    : `Labels · ${status.toUpperCase()} orders`;

  const html = renderLabelPage(orders, title);
  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
