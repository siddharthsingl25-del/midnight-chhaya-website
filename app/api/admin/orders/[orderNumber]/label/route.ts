/**
 * GET /api/admin/orders/[orderNumber]/label
 *
 * Returns a print-ready HTML shipping label. Auto-triggers the browser's
 * print dialog on load so the merchant can hit "Save as PDF" or send it
 * straight to their thermal printer.
 *
 * Layout: 4x6 inch (standard courier label). Contains:
 *   TO   → customer name, full address, pincode, phone
 *   FROM → STORE_SENDER info from lib/site.ts (edit there to change)
 *   Order # + item summary at the bottom for warehouse pickers.
 *
 * No Shiprocket, no courier API — this is a plain address label the
 * merchant sticks on the parcel and hands to any courier.
 */

import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabase";
import { STORE_SENDER } from "@/lib/site";

type Params = { params: Promise<{ orderNumber: string }> };

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const nl2br = (s: string) => escapeHtml(s).replace(/\r?\n/g, "<br/>");

export async function GET(_req: Request, { params }: Params) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { orderNumber } = await params;
  const ref = decodeURIComponent(orderNumber).trim().toUpperCase();
  const withPrefix = ref.startsWith("MC-") ? ref : `MC-${ref}`;

  const sb = supabaseAdmin();
  const { data: order, error } = await sb
    .from("orders")
    .select(
      "order_number, created_at, customer_name, customer_phone, delivery_address, items, payment_method, total"
    )
    .eq("order_number", withPrefix)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!order) {
    return NextResponse.json({ error: `Order ${withPrefix} not found` }, { status: 404 });
  }

  const items = (order.items as Array<{
    name: string;
    qty: number;
    chainName?: string | null;
  }>) ?? [];

  const senderLines = [
    STORE_SENDER.line1,
    STORE_SENDER.line2,
    [STORE_SENDER.city, STORE_SENDER.state, STORE_SENDER.pincode]
      .filter(Boolean)
      .join(", "),
  ]
    .filter(Boolean)
    .map(escapeHtml)
    .join("<br/>");

  const senderMissing = !STORE_SENDER.line1 && !STORE_SENDER.city;

  const paymentBadge =
    order.payment_method === "cod"
      ? `<div class="cod-badge">COD · Collect ₹${Math.round(Number(order.total)).toLocaleString("en-IN")}</div>`
      : `<div class="prepaid-badge">PREPAID</div>`;

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Label · ${escapeHtml(order.order_number)}</title>
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #eaeaea; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; color: #000; }
    .toolbar { position: sticky; top: 0; background: #111; color: #fff; padding: 12px 16px; display: flex; gap: 12px; align-items: center; justify-content: space-between; }
    .toolbar h1 { font-size: 14px; margin: 0; font-weight: 500; letter-spacing: 0.05em; }
    .toolbar button { background: #d4af37; color: #111; border: none; padding: 8px 16px; font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; }
    .warn { background: #ff9800; color: #111; padding: 10px 16px; font-size: 12px; text-align: center; }
    .label {
      width: 4in;
      min-height: 6in;
      margin: 24px auto;
      background: #fff;
      padding: 0.25in;
      color: #000;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      border: 1px solid #ccc;
      display: flex;
      flex-direction: column;
      font-size: 11pt;
      line-height: 1.35;
    }
    .row { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
    .order-no { font-size: 10pt; font-family: "Courier New", monospace; font-weight: 700; letter-spacing: 0.05em; }
    .cod-badge { background: #000; color: #fff; padding: 4px 8px; font-size: 9pt; font-weight: 700; letter-spacing: 0.08em; }
    .prepaid-badge { border: 1.5px solid #000; padding: 4px 8px; font-size: 9pt; font-weight: 700; letter-spacing: 0.08em; }
    .hr { border-top: 1px solid #000; margin: 8px 0; }
    .section-label { font-size: 8pt; letter-spacing: 0.15em; text-transform: uppercase; color: #666; margin-bottom: 2px; }
    .to-block { border: 2px solid #000; padding: 10px 12px; margin: 4px 0 10px; }
    .to-block .name { font-size: 14pt; font-weight: 700; margin-bottom: 4px; }
    .to-block .addr { font-size: 11pt; white-space: pre-wrap; }
    .to-block .phone { margin-top: 6px; font-size: 11pt; font-weight: 600; }
    .from-block { font-size: 9pt; }
    .from-block .name { font-weight: 700; margin-bottom: 2px; }
    .items { margin-top: auto; padding-top: 8px; border-top: 1px dashed #999; font-size: 8pt; color: #333; }
    .items .head { font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 3px; color: #666; font-size: 7pt; }
    .items .item { }
    @media print {
      body { background: #fff; }
      .toolbar, .warn { display: none; }
      .label { margin: 0; box-shadow: none; border: none; width: 100%; min-height: auto; padding: 0.15in; }
      @page { size: 4in 6in; margin: 0; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <h1>Label · ${escapeHtml(order.order_number)}</h1>
    <button onclick="window.print()">Print / Save as PDF</button>
  </div>
  ${senderMissing ? `<div class="warn">⚠ Sender info is empty. Edit STORE_SENDER in lib/site.ts so the courier knows where to pick up / return.</div>` : ""}
  <div class="label">
    <div class="row">
      <div class="order-no">${escapeHtml(order.order_number)}</div>
      ${paymentBadge}
    </div>

    <div class="hr"></div>

    <div class="section-label">Deliver to</div>
    <div class="to-block">
      <div class="name">${escapeHtml(order.customer_name || "—")}</div>
      <div class="addr">${nl2br(order.delivery_address || "—")}</div>
      <div class="phone">📞 ${escapeHtml(order.customer_phone || "—")}</div>
    </div>

    <div class="section-label">From</div>
    <div class="from-block">
      <div class="name">${escapeHtml(STORE_SENDER.name)}</div>
      ${senderLines || '<span style="color:#c00">— (set in lib/site.ts)</span>'}
      ${STORE_SENDER.phone ? `<div style="margin-top:4px;">📞 ${escapeHtml(STORE_SENDER.phone)}</div>` : ""}
    </div>

    <div class="items">
      <div class="head">Contents · ${items.reduce((s, i) => s + (i.qty || 0), 0)} item(s)</div>
      ${items
        .map(
          (it) =>
            `<div class="item">· ${escapeHtml(it.name)} × ${it.qty}${it.chainName ? ` <em>(${escapeHtml(it.chainName)})</em>` : ""}</div>`
        )
        .join("")}
    </div>
  </div>
  <script>
    // Auto-open print dialog once the page settles.
    window.addEventListener("load", () => setTimeout(() => window.print(), 300));
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
