/**
 * Shipping label renderer — shared between the single-order label
 * route and the bulk (print-many) route.
 *
 * Layout: 9cm × 9cm label, 4 labels per A4 sheet (2×2 grid).
 * A4 = 210mm × 297mm. Grid = 180×180mm centred. Page breaks every 4.
 *
 * Kept as HTML+CSS (no PDF library) so the browser's Save-as-PDF and
 * direct-to-printer workflow both just work.
 */

import { STORE_SENDER } from "@/lib/site";

export type LabelOrder = {
  order_number: string;
  customer_name: string | null;
  customer_phone: string | null;
  delivery_address: string | null;
  payment_method: "online" | "cash" | "cod" | string;
  total: number;
  items?: Array<{ name: string; qty: number; chainName?: string | null }> | null;
};

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const nl2br = (s: string) => escapeHtml(s).replace(/\r?\n/g, "<br/>");

function senderBlock(): string {
  const cityLine = [STORE_SENDER.city, STORE_SENDER.state, STORE_SENDER.pincode]
    .filter(Boolean)
    .join(", ");
  const parts = [STORE_SENDER.line1, STORE_SENDER.line2, cityLine]
    .filter(Boolean)
    .map(escapeHtml)
    .join("<br/>");
  const phone = STORE_SENDER.phone
    ? `<br/>Ph: ${escapeHtml(STORE_SENDER.phone)}`
    : "";
  return `<b>${escapeHtml(STORE_SENDER.name)}</b><br/>${parts || "—"}${phone}`;
}

function paymentBadge(order: LabelOrder): string {
  if (order.payment_method === "cod") {
    return `<span class="badge cod">COD ₹${Math.round(Number(order.total)).toLocaleString("en-IN")}</span>`;
  }
  return `<span class="badge prepaid">PREPAID</span>`;
}

function itemsBlock(order: LabelOrder): string {
  const items = order.items ?? [];
  if (items.length === 0) return "";
  const totalQty = items.reduce((s, it) => s + (it.qty || 0), 0);
  const lines = items
    .map(
      (it) =>
        `<div class="item">· ${escapeHtml(it.name)} × ${it.qty}${it.chainName ? ` <em>(${escapeHtml(it.chainName)})</em>` : ""}</div>`
    )
    .join("");
  return `<div class="items">
    <div class="items-lbl">CONTENTS · ${totalQty} item${totalQty === 1 ? "" : "s"}</div>
    ${lines}
  </div>`;
}

function labelCard(order: LabelOrder): string {
  return `<div class="label">
    <div class="head">
      <span class="ordno">${escapeHtml(order.order_number)}</span>
      ${paymentBadge(order)}
    </div>

    <div class="to">
      <div class="to-lbl">TO</div>
      <div class="name">${escapeHtml(order.customer_name || "—")}</div>
      <div class="addr">${nl2br(order.delivery_address || "—")}</div>
      <div class="phone">Ph: ${escapeHtml(order.customer_phone || "—")}</div>
    </div>

    ${itemsBlock(order)}

    <div class="from">
      <div class="from-lbl">FROM</div>
      <div class="from-body">${senderBlock()}</div>
    </div>
  </div>`;
}

export function renderLabelPage(orders: LabelOrder[], title: string): string {
  const cards = orders.map(labelCard).join("\n");
  const senderMissing = !STORE_SENDER.line1 && !STORE_SENDER.city;

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #eaeaea; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; color: #000; }
    .toolbar { position: sticky; top: 0; z-index: 10; background: #111; color: #fff; padding: 12px 16px; display: flex; gap: 12px; align-items: center; justify-content: space-between; }
    .toolbar h1 { font-size: 14px; margin: 0; font-weight: 500; letter-spacing: 0.05em; }
    .toolbar button { background: #d4af37; color: #111; border: none; padding: 8px 16px; font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; }
    .warn { background: #ff9800; color: #111; padding: 10px 16px; font-size: 12px; text-align: center; }

    /* --- A4 sheet, 2x2 grid of 9x9cm labels --- */
    .sheet {
      width: 210mm;
      height: 297mm;
      margin: 12mm auto;
      padding: 15mm;
      background: #fff;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      display: grid;
      grid-template-columns: 90mm 90mm;
      grid-template-rows: 90mm 90mm;
      gap: 0;
      align-content: start;
      justify-content: center;
      column-gap: 0;
      row-gap: 0;
    }
    .label {
      width: 90mm;
      height: 90mm;
      padding: 3mm 4mm;
      border: 1px dashed #888;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      font-size: 8.5pt;
      line-height: 1.2;
      color: #000;
      background: #fff;
    }
    .head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5mm; }
    .ordno { font-family: "Courier New", monospace; font-weight: 700; font-size: 8.5pt; letter-spacing: 0.04em; }
    .badge { font-size: 6.5pt; font-weight: 700; padding: 0.8mm 1.8mm; letter-spacing: 0.05em; }
    .badge.prepaid { border: 1px solid #000; }
    .badge.cod { background: #000; color: #fff; }
    .to { border-top: 1px solid #000; padding-top: 1.5mm; }
    .to-lbl { font-size: 5.5pt; letter-spacing: 0.2em; color: #666; margin-bottom: 0.5mm; }
    .name { font-size: 11pt; font-weight: 700; margin-bottom: 0.5mm; line-height: 1.1; }
    .addr { font-size: 8.5pt; font-weight: 700; color: #000; white-space: pre-wrap; line-height: 1.25; }
    .phone { margin-top: 1mm; font-size: 9pt; font-weight: 800; color: #000; }
    .items { flex: 1; border-top: 1px dashed #888; padding-top: 1.5mm; margin-top: 1.5mm; font-size: 7pt; line-height: 1.25; color: #000; overflow: hidden; }
    .items-lbl { font-size: 5.5pt; letter-spacing: 0.2em; color: #666; margin-bottom: 0.5mm; font-weight: 700; }
    .item { font-size: 7pt; }
    .item em { font-style: normal; color: #555; }
    .from { border-top: 1px dashed #888; padding-top: 1mm; margin-top: 1.5mm; font-size: 7pt; font-weight: 700; line-height: 1.2; color: #000; }
    .from-lbl { font-size: 5pt; letter-spacing: 0.2em; color: #666; margin-bottom: 0.3mm; font-weight: 400; }
    .empty { border: none; }

    @media print {
      body { background: #fff; }
      .toolbar, .warn { display: none !important; }
      .sheet { margin: 0; box-shadow: none; page-break-after: always; }
      .sheet:last-child { page-break-after: auto; }
      @page { size: A4; margin: 0; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <h1>${escapeHtml(title)} · ${orders.length} label${orders.length === 1 ? "" : "s"}</h1>
    <button onclick="window.print()">Print / Save as PDF</button>
  </div>
  ${senderMissing ? `<div class="warn">⚠ STORE_SENDER is empty. Edit lib/site.ts so the From block prints correctly.</div>` : ""}
  ${sheetsHtml(orders)}
  <script>
    window.addEventListener("load", () => setTimeout(() => window.print(), 400));
  </script>
</body>
</html>`;
}

function sheetsHtml(orders: LabelOrder[]): string {
  const sheets: string[] = [];
  for (let i = 0; i < orders.length; i += 4) {
    const group = orders.slice(i, i + 4);
    const cards = group.map(labelCard).join("\n");
    const blanks = 4 - group.length;
    const blankHtml = Array.from({ length: blanks })
      .map(() => `<div class="label empty"></div>`)
      .join("\n");
    sheets.push(`<div class="sheet">${cards}${blankHtml}</div>`);
  }
  return sheets.join("\n");
}
