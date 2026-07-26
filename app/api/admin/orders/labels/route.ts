/**
 * GET /api/admin/orders/labels?status=paid
 *
 * Bulk print-ready HTML shipping labels — A4, 6 labels (2×3) per sheet,
 * each 9×9 cm. Auto-triggers browser print dialog on load.
 *
 * Query params:
 *   status=paid|shipped|delivered  (defaults to paid — the usual "new
 *                                   orders ready to pack" queue)
 *   orders=MC-0001,MC-0002         (explicit list, overrides status)
 *   all=1                          (include orders whose label was already
 *                                   printed — use when reprinting)
 *
 * Behaviour: by default an order that's already had its label printed
 * is EXCLUDED — we stamp label_printed_at every time this route runs so
 * you don't re-download the same label. Pass all=1 to force include.
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
  const includeAlreadyPrinted = url.searchParams.get("all") === "1";

  const sb = supabaseAdmin();
  let query = sb
    .from("orders")
    .select(
      "order_number, customer_name, customer_phone, delivery_address, payment_method, total, items, created_at"
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

  // Exclude orders whose labels are already printed unless the caller
  // explicitly asked for them (reprint / explicit-selection use cases).
  if (!includeAlreadyPrinted && !ordersParam) {
    query = query.is("label_printed_at", null);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const orders = (data ?? []) as LabelOrder[];
  if (orders.length === 0) {
    return new NextResponse(
      `<!doctype html><meta charset="utf-8"><title>No labels</title>
       <body style="font-family:sans-serif;padding:40px;text-align:center;color:#333;">
         <h2>No new labels to print</h2>
         <p>All ${status} orders have already had their labels printed.<br/>
         Use the per-order <b>Reprint</b> button in Admin if you need another copy.</p>
       </body>`,
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  // Stamp the print time on every label served so they drop out of the
  // default queue next time. Fire-and-forget.
  const orderNumbers = orders.map((o) => o.order_number);
  void sb
    .from("orders")
    .update({ label_printed_at: new Date().toISOString() })
    .in("order_number", orderNumbers);

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
