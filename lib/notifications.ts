/**
 * Order-confirmation notifications.
 *
 * Two outbound channels, both fired after Razorpay payment verification:
 *   - Email via Gmail SMTP            (SMTP_USER = your gmail address,
 *                                      SMTP_PASS = a Google App Password,
 *                                      EMAIL_FROM_NAME optional display name,
 *                                      SMTP_HOST / SMTP_PORT optional overrides)
 *   - WhatsApp via Meta Cloud API     (WHATSAPP_PHONE_NUMBER_ID,
 *                                      WHATSAPP_ACCESS_TOKEN,
 *                                      WHATSAPP_TEMPLATE_NAME,
 *                                      WHATSAPP_TEMPLATE_LANG default 'en')
 *
 * Both providers are free for starting — Gmail sends ~500/day from your
 * own address, Meta gives 1k WhatsApp service conversations/mo. If a
 * provider's env vars are missing, the function silently skips (returns
 * { ok: false, skipped: true }). Dev / preview environments don't crash;
 * production just needs the vars set.
 *
 * The WhatsApp template referenced by WHATSAPP_TEMPLATE_NAME must be
 * pre-approved by Meta with exactly THREE body variables in this order:
 *   {{1}} = customer name
 *   {{2}} = order number (e.g. "MC-00042")
 *   {{3}} = total amount (formatted, e.g. "₹2,499")
 * Adjust the `parameters` array below if your template uses different vars.
 */

import nodemailer from "nodemailer";
import { SITE } from "@/lib/site";

export type OrderItem = {
  name: string;
  chainName?: string | null;
  qty: number;
  unitPrice: number | null;
};

export type OrderSnapshot = {
  /** Raw Razorpay payment id — kept as a secondary reference. */
  paymentId: string;
  /** Human-friendly order number (e.g. "MC-00042"). Falls back to paymentId. */
  orderNumber: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  address: string;
};

/* —— Email (Gmail SMTP via nodemailer) ——————————————————— */

export async function sendOrderConfirmationEmail(
  order: OrderSnapshot
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) return { ok: false, skipped: true };
  if (!order.customer.email) return { ok: false, skipped: true };

  const host = process.env.SMTP_HOST ?? "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT ?? 465);
  const fromName = process.env.EMAIL_FROM_NAME ?? SITE.name;

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    await transporter.sendMail({
      from: `"${fromName}" <${user}>`,
      to: order.customer.email,
      subject: `Order confirmed — ${SITE.name} (${order.orderNumber})`,
      html: renderOrderEmailHtml(order),
      text: renderOrderEmailText(order),
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "unknown" };
  }
}

/* —— Shipped + delivered emails ——————————————————————————— */

export type ShippedInfo = {
  trackingId?: string | null;
  courierPartner?: string | null;
  trackingUrl?: string | null;
};

export async function sendOrderShippedEmail(
  order: OrderSnapshot,
  shipped: ShippedInfo
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) return { ok: false, skipped: true };
  if (!order.customer.email) return { ok: false, skipped: true };

  const host = process.env.SMTP_HOST ?? "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT ?? 465);
  const fromName = process.env.EMAIL_FROM_NAME ?? SITE.name;

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    await transporter.sendMail({
      from: `"${fromName}" <${user}>`,
      to: order.customer.email,
      subject: `Your order has shipped — ${SITE.name} (${order.orderNumber})`,
      html: renderShippedEmailHtml(order, shipped),
      text: renderShippedEmailText(order, shipped),
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "unknown" };
  }
}

export async function sendOrderDeliveredEmail(
  order: OrderSnapshot
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) return { ok: false, skipped: true };
  if (!order.customer.email) return { ok: false, skipped: true };

  const host = process.env.SMTP_HOST ?? "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT ?? 465);
  const fromName = process.env.EMAIL_FROM_NAME ?? SITE.name;

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    await transporter.sendMail({
      from: `"${fromName}" <${user}>`,
      to: order.customer.email,
      subject: `Delivered · thank you — ${SITE.name} (${order.orderNumber})`,
      html: renderDeliveredEmailHtml(order),
      text: renderDeliveredEmailText(order),
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "unknown" };
  }
}

function renderShippedEmailText(o: OrderSnapshot, s: ShippedInfo): string {
  const lines = [
    `Hi ${o.customer.name || "there"},`,
    "",
    `Your order ${o.orderNumber} has been shipped.`,
    "",
  ];
  if (s.courierPartner) lines.push(`Courier: ${s.courierPartner}`);
  if (s.trackingId) lines.push(`Tracking ID: ${s.trackingId}`);
  if (s.trackingUrl) lines.push(`Track: ${s.trackingUrl}`);
  lines.push("", "— Midnight Chhaya");
  return lines.join("\n");
}

function renderShippedEmailHtml(o: OrderSnapshot, s: ShippedInfo): string {
  const trackButton = s.trackingUrl
    ? `<div style="text-align:center;margin:28px 0;">
         <a href="${escapeHtml(s.trackingUrl)}"
            style="display:inline-block;padding:14px 32px;background:#b8935a;color:#0a0a0a;text-decoration:none;font-family:Arial,sans-serif;font-size:12px;letter-spacing:0.3em;text-transform:uppercase;">
           Track shipment
         </a>
       </div>`
    : "";
  return `
  <html><body style="margin:0;background:#0a0a0a;font-family:Arial,sans-serif;color:#e8e2d4;">
    <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
      <p style="text-align:center;color:#b8935a;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 8px;">Midnight Chhaya</p>
      <h1 style="text-align:center;font-family:Georgia,serif;color:#e8e2d4;font-size:24px;font-weight:normal;letter-spacing:0.04em;text-transform:uppercase;margin:18px 0 6px;">Your order is on the way.</h1>
      <p style="text-align:center;color:#8a8578;font-style:italic;font-size:14px;margin:6px 0 30px;">${escapeHtml(o.customer.name || "Order")} — ${escapeHtml(o.orderNumber)}</p>
      <div style="border:1px solid rgba(184,147,90,0.3);padding:20px 24px;margin:24px 0;">
        ${s.courierPartner ? `<p style="margin:6px 0;font-size:14px;"><span style="color:#8a8578;">Courier:</span> <strong>${escapeHtml(s.courierPartner)}</strong></p>` : ""}
        ${s.trackingId ? `<p style="margin:6px 0;font-size:14px;"><span style="color:#8a8578;">Tracking ID:</span> <strong style="font-family:monospace;">${escapeHtml(s.trackingId)}</strong></p>` : ""}
      </div>
      ${trackButton}
      <p style="text-align:center;color:#8a8578;font-style:italic;font-size:12px;margin:32px 0 0;">Adornments forged in shadow.</p>
    </div>
  </body></html>`;
}

function renderDeliveredEmailText(o: OrderSnapshot): string {
  return [
    `Hi ${o.customer.name || "there"},`,
    "",
    `Your order ${o.orderNumber} has been delivered. We hope you love it.`,
    "",
    "If anything is off, reply to this email and we'll make it right.",
    "",
    "— Midnight Chhaya",
  ].join("\n");
}

function renderDeliveredEmailHtml(o: OrderSnapshot): string {
  return `
  <html><body style="margin:0;background:#0a0a0a;font-family:Arial,sans-serif;color:#e8e2d4;">
    <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
      <p style="text-align:center;color:#b8935a;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 8px;">Midnight Chhaya</p>
      <h1 style="text-align:center;font-family:Georgia,serif;color:#e8e2d4;font-size:24px;font-weight:normal;letter-spacing:0.04em;text-transform:uppercase;margin:18px 0 6px;">Delivered.</h1>
      <p style="text-align:center;color:#8a8578;font-style:italic;font-size:14px;margin:6px 0 30px;">${escapeHtml(o.customer.name || "Order")} — ${escapeHtml(o.orderNumber)}</p>
      <p style="text-align:center;font-size:14px;margin:24px 0;">We hope you love it. If anything is off, reply and we'll make it right.</p>
      <p style="text-align:center;color:#8a8578;font-style:italic;font-size:12px;margin:32px 0 0;">Adornments forged in shadow.</p>
    </div>
  </body></html>`;
}

/* —— WhatsApp (Meta Cloud API) ——————————————————————————— */

export async function sendOrderConfirmationWhatsApp(
  order: OrderSnapshot
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME;
  const templateLang = process.env.WHATSAPP_TEMPLATE_LANG ?? "en";
  if (!phoneNumberId || !accessToken || !templateName) {
    return { ok: false, skipped: true };
  }

  const to = normalizeIndianPhone(order.customer.phone);
  if (!to) return { ok: false, skipped: true };

  const totalFormatted = `${SITE.currency.symbol}${order.total.toLocaleString("en-IN")}`;

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: {
            name: templateName,
            language: { code: templateLang },
            components: [
              {
                type: "body",
                parameters: [
                  { type: "text", text: order.customer.name || "Customer" },
                  { type: "text", text: order.orderNumber },
                  { type: "text", text: totalFormatted },
                ],
              },
            ],
          },
        }),
      }
    );
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: `WhatsApp ${res.status}: ${body.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "unknown" };
  }
}

/* —— helpers ——————————————————————————————————————————— */

/**
 * Accepts free-text phone input and returns AiSensy's expected format:
 * country code + number, no spaces, no plus. Defaults to India (91)
 * when the input is a 10-digit number with no country code. Returns
 * null if the result doesn't look like a valid Indian mobile.
 */
function normalizeIndianPhone(raw: string): string | null {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  if (digits.length === 13 && digits.startsWith("091")) return digits.slice(1);
  return null;
}

function fmtPrice(n: number): string {
  return `${SITE.currency.symbol}${n.toLocaleString("en-IN")}`;
}

function renderOrderEmailText(o: OrderSnapshot): string {
  const items = o.items
    .map((it) => {
      const chain = it.chainName ? ` (Chain: ${it.chainName})` : "";
      const line =
        it.unitPrice == null
          ? "Inquire"
          : `${fmtPrice(it.unitPrice)} × ${it.qty} = ${fmtPrice(it.unitPrice * it.qty)}`;
      return `• ${it.name}${chain}\n  ${line}`;
    })
    .join("\n");
  return [
    `Hi ${o.customer.name || "there"},`,
    ``,
    `Thank you — your ${SITE.name} order is confirmed.`,
    ``,
    `Order number: ${o.orderNumber}`,
    `Payment ref:  ${o.paymentId}`,
    ``,
    items,
    ``,
    `Subtotal: ${fmtPrice(o.subtotal)}`,
    `Shipping: ${o.shipping === 0 ? "Free" : fmtPrice(o.shipping)}`,
    `Total:    ${fmtPrice(o.total)}`,
    ``,
    `Deliver to:`,
    o.address,
    ``,
    `Your order ships within 1–3 business days. We'll send the tracking link as soon as it's dispatched.`,
    ``,
    `— ${SITE.name}`,
    SITE.url,
  ].join("\n");
}

function renderOrderEmailHtml(o: OrderSnapshot): string {
  const rows = o.items
    .map((it) => {
      const chain = it.chainName
        ? `<div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#b8935a;margin-top:4px;">${escapeHtml(it.chainName)}</div>`
        : "";
      const lineTotal =
        it.unitPrice == null
          ? "Inquire"
          : fmtPrice(it.unitPrice * it.qty);
      return `
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid #2a2825;color:#e8e2d4;font-family:Georgia,serif;">
            <div style="font-size:15px;">${escapeHtml(it.name)}</div>
            ${chain}
            <div style="font-size:12px;color:#8a8474;margin-top:4px;">Qty ${it.qty}</div>
          </td>
          <td style="padding:14px 0;border-bottom:1px solid #2a2825;color:#e8e2d4;font-family:Georgia,serif;font-size:14px;text-align:right;white-space:nowrap;">${lineTotal}</td>
        </tr>`;
    })
    .join("");

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#0d0c0a;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#0d0c0a;">
    <tr><td align="center" style="padding:40px 20px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" style="max-width:560px;background:#15130f;border:1px solid #2a2825;">
        <tr><td style="padding:32px 32px 8px;text-align:center;">
          <div style="font-family:Georgia,serif;color:#b8935a;font-size:11px;letter-spacing:0.32em;text-transform:uppercase;">${escapeHtml(SITE.name)}</div>
          <h1 style="font-family:Georgia,serif;color:#e8e2d4;font-size:28px;font-weight:normal;letter-spacing:0.04em;text-transform:uppercase;margin:18px 0 8px;">Order confirmed.</h1>
          <p style="font-family:Georgia,serif;font-style:italic;color:#8a8474;font-size:15px;margin:0;">Hi ${escapeHtml(o.customer.name || "there")} — payment received.</p>
        </td></tr>

        <tr><td style="padding:24px 32px 0;">
          <div style="font-family:Georgia,serif;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#8a8474;">Order number</div>
          <div style="font-family:Menlo,Consolas,monospace;color:#b8935a;font-size:22px;letter-spacing:0.08em;margin-top:6px;">${escapeHtml(o.orderNumber)}</div>
          <div style="font-family:Georgia,serif;font-size:11px;color:#5a5650;margin-top:6px;">Quote this number for any support query.</div>
        </td></tr>

        <tr><td style="padding:24px 32px 0;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            ${rows}
          </table>
        </td></tr>

        <tr><td style="padding:24px 32px 8px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="font-family:Georgia,serif;color:#e8e2d4;font-size:14px;">
            <tr><td style="padding:6px 0;color:#8a8474;">Subtotal</td><td style="padding:6px 0;text-align:right;">${fmtPrice(o.subtotal)}</td></tr>
            <tr><td style="padding:6px 0;color:#8a8474;">Shipping</td><td style="padding:6px 0;text-align:right;color:${o.shipping === 0 ? "#b8935a" : "#e8e2d4"};">${o.shipping === 0 ? "Free" : fmtPrice(o.shipping)}</td></tr>
            <tr><td style="padding:14px 0 0;border-top:1px solid #2a2825;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#8a8474;">Total</td><td style="padding:14px 0 0;border-top:1px solid #2a2825;text-align:right;font-size:22px;">${fmtPrice(o.total)}</td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:24px 32px 0;">
          <div style="font-family:Georgia,serif;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#8a8474;margin-bottom:8px;">Deliver to</div>
          <div style="font-family:Georgia,serif;color:#e8e2d4;font-size:14px;line-height:1.6;white-space:pre-line;">${escapeHtml(o.address)}</div>
        </td></tr>

        <tr><td style="padding:32px 32px 36px;">
          <p style="font-family:Georgia,serif;font-style:italic;color:#8a8474;font-size:14px;line-height:1.7;margin:0;">
            Your order ships within 1–3 business days. We'll message you the moment it's dispatched.
          </p>
        </td></tr>

        <tr><td style="padding:0 32px 32px;text-align:center;border-top:1px solid #2a2825;">
          <p style="font-family:Georgia,serif;color:#8a8474;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin:24px 0 0;">${escapeHtml(SITE.name)}</p>
          <p style="font-family:Georgia,serif;font-style:italic;color:#8a8474;font-size:12px;margin:6px 0 0;">${escapeHtml(SITE.tagline)}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ─────────────────────────────────────────────────────────────────────────
 * Shared send helpers — used by the order-confirmation functions above
 * and the lead-recovery / feedback functions below.
 * ───────────────────────────────────────────────────────────────────────── */

async function sendGmailEmail(
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) return { ok: false, skipped: true };
  if (!to) return { ok: false, skipped: true };
  const host = process.env.SMTP_HOST ?? "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT ?? 465);
  const fromName = process.env.EMAIL_FROM_NAME ?? SITE.name;
  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    await transporter.sendMail({
      from: `"${fromName}" <${user}>`,
      to,
      subject,
      html,
      text,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "unknown" };
  }
}

async function sendWhatsAppTemplate(
  phone: string,
  templateName: string | undefined,
  bodyParams: string[]
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const lang = process.env.WHATSAPP_TEMPLATE_LANG ?? "en";
  if (!phoneNumberId || !accessToken || !templateName) {
    return { ok: false, skipped: true };
  }
  const to = normalizeIndianPhone(phone);
  if (!to) return { ok: false, skipped: true };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: {
            name: templateName,
            language: { code: lang },
            components: [
              {
                type: "body",
                parameters: bodyParams.map((text) => ({ type: "text", text })),
              },
            ],
          },
        }),
      }
    );
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: `WhatsApp ${res.status}: ${body.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "unknown" };
  }
}

/* ─────────────────────────────────────────────────────────────────────────
 * Feedback request — sent 3 days after a paid order.
 *
 * WHATSAPP_FEEDBACK_TEMPLATE_NAME must be a Meta-approved utility
 * template with TWO body variables in this order:
 *   {{1}} = customer name
 *   {{2}} = feedback URL (e.g. https://midnightchhaya.com/feedback/MC-00042)
 * ───────────────────────────────────────────────────────────────────────── */

export type FeedbackRequest = {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  feedbackUrl: string;
};

export async function sendFeedbackRequestEmail(req: FeedbackRequest) {
  const subject = `How was your ${SITE.name} piece? · ${req.orderNumber}`;
  const text = [
    `Hi ${req.customerName || "there"},`,
    ``,
    `Your ${SITE.name} order ${req.orderNumber} should have reached you by now.`,
    `If it has — how is it? Drop a quick rating + a line:`,
    ``,
    req.feedbackUrl,
    ``,
    `Even one line helps us a lot — we read every reply.`,
    ``,
    `— ${SITE.name}`,
    SITE.url,
  ].join("\n");

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#0d0c0a;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#0d0c0a;">
    <tr><td align="center" style="padding:40px 20px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" style="max-width:560px;background:#15130f;border:1px solid #2a2825;">
        <tr><td style="padding:32px 32px 8px;text-align:center;">
          <div style="font-family:Georgia,serif;color:#b8935a;font-size:11px;letter-spacing:0.32em;text-transform:uppercase;">${escapeHtml(SITE.name)}</div>
          <h1 style="font-family:Georgia,serif;color:#e8e2d4;font-size:24px;font-weight:normal;letter-spacing:0.04em;text-transform:uppercase;margin:18px 0 6px;">How is it wearing?</h1>
          <p style="font-family:Georgia,serif;font-style:italic;color:#8a8474;font-size:15px;margin:0;">Hi ${escapeHtml(req.customerName || "there")} — your order ${escapeHtml(req.orderNumber)} should have reached you by now.</p>
        </td></tr>

        <tr><td style="padding:24px 32px 0;text-align:center;">
          <p style="font-family:Georgia,serif;color:#e8e2d4;font-size:15px;line-height:1.7;margin:0 0 28px;">
            One line + a star rating helps us a lot. We read every reply.
          </p>
          <a href="${escapeHtml(req.feedbackUrl)}"
             style="display:inline-block;padding:14px 36px;background:#b8935a;color:#0d0c0a;
                    font-family:Georgia,serif;font-size:13px;letter-spacing:0.18em;
                    text-transform:uppercase;text-decoration:none;">
            Leave feedback
          </a>
        </td></tr>

        <tr><td style="padding:36px 32px 32px;text-align:center;border-top:1px solid #2a2825;">
          <p style="font-family:Georgia,serif;color:#8a8474;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin:24px 0 0;">${escapeHtml(SITE.name)}</p>
          <p style="font-family:Georgia,serif;font-style:italic;color:#8a8474;font-size:12px;margin:6px 0 0;">${escapeHtml(SITE.tagline)}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return sendGmailEmail(req.customerEmail, subject, html, text);
}

export async function sendFeedbackRequestWhatsApp(req: FeedbackRequest) {
  return sendWhatsAppTemplate(
    req.customerPhone,
    process.env.WHATSAPP_FEEDBACK_TEMPLATE_NAME,
    [req.customerName || "Customer", req.feedbackUrl]
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * Abandoned-cart recovery — sent 1-24h after a Razorpay order was
 * created but never paid.
 *
 * WHATSAPP_ABANDONED_TEMPLATE_NAME must be a Meta-approved MARKETING
 * template with THREE body variables in this order:
 *   {{1}} = customer name
 *   {{2}} = discount code (e.g. BACK10-A1B2C3)
 *   {{3}} = checkout URL
 * Marketing templates are stricter to approve — Meta wants an opt-in
 * trail. Until approved this function will silently skip.
 * ───────────────────────────────────────────────────────────────────────── */

export type AbandonedCart = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  itemSummary: string;
  total: number;
  recoveryCode: string;
  percentOff: number;
  checkoutUrl: string;
};

export async function sendAbandonedCartEmail(cart: AbandonedCart) {
  const subject = `You left something behind · ${cart.percentOff}% off if you finish now`;
  const totalFormatted = `${SITE.currency.symbol}${cart.total.toLocaleString("en-IN")}`;

  const text = [
    `Hi ${cart.customerName || "there"},`,
    ``,
    `You almost made it. Your ${SITE.name} bag still has:`,
    ``,
    cart.itemSummary,
    ``,
    `Total: ${totalFormatted}`,
    ``,
    `If you come back within 24 hours, this code takes ${cart.percentOff}% off:`,
    `   ${cart.recoveryCode}`,
    ``,
    `Finish the order: ${cart.checkoutUrl}`,
    ``,
    `— ${SITE.name}`,
    SITE.url,
  ].join("\n");

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#0d0c0a;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#0d0c0a;">
    <tr><td align="center" style="padding:40px 20px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" style="max-width:560px;background:#15130f;border:1px solid #2a2825;">
        <tr><td style="padding:32px 32px 8px;text-align:center;">
          <div style="font-family:Georgia,serif;color:#b8935a;font-size:11px;letter-spacing:0.32em;text-transform:uppercase;">${escapeHtml(SITE.name)}</div>
          <h1 style="font-family:Georgia,serif;color:#e8e2d4;font-size:24px;font-weight:normal;letter-spacing:0.04em;text-transform:uppercase;margin:18px 0 6px;">You left something behind.</h1>
          <p style="font-family:Georgia,serif;font-style:italic;color:#8a8474;font-size:15px;margin:0;">Hi ${escapeHtml(cart.customerName || "there")} — your bag is still waiting.</p>
        </td></tr>

        <tr><td style="padding:24px 32px 0;">
          <pre style="font-family:Georgia,serif;color:#e8e2d4;font-size:14px;line-height:1.7;margin:0;white-space:pre-wrap;">${escapeHtml(cart.itemSummary)}</pre>
          <div style="margin-top:18px;font-family:Georgia,serif;color:#e8e2d4;font-size:14px;">
            <strong style="color:#8a8474;font-weight:normal;">Total:</strong> ${escapeHtml(totalFormatted)}
          </div>
        </td></tr>

        <tr><td style="padding:24px 32px 0;text-align:center;">
          <div style="font-family:Georgia,serif;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#8a8474;">${cart.percentOff}% off if you finish now</div>
          <div style="font-family:Menlo,Consolas,monospace;color:#b8935a;font-size:24px;letter-spacing:0.18em;margin-top:8px;padding:12px 24px;border:1px dashed #b8935a;display:inline-block;">
            ${escapeHtml(cart.recoveryCode)}
          </div>
          <div style="font-family:Georgia,serif;font-size:11px;color:#5a5650;margin-top:8px;">Use it at checkout. Valid for 24 hours.</div>
        </td></tr>

        <tr><td style="padding:24px 32px 0;text-align:center;">
          <a href="${escapeHtml(cart.checkoutUrl)}"
             style="display:inline-block;padding:14px 36px;background:#b8935a;color:#0d0c0a;
                    font-family:Georgia,serif;font-size:13px;letter-spacing:0.18em;
                    text-transform:uppercase;text-decoration:none;">
            Finish my order
          </a>
        </td></tr>

        <tr><td style="padding:36px 32px 32px;text-align:center;border-top:1px solid #2a2825;">
          <p style="font-family:Georgia,serif;color:#8a8474;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin:24px 0 0;">${escapeHtml(SITE.name)}</p>
          <p style="font-family:Georgia,serif;font-style:italic;color:#8a8474;font-size:12px;margin:6px 0 0;">${escapeHtml(SITE.tagline)}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return sendGmailEmail(cart.customerEmail, subject, html, text);
}

export async function sendAbandonedCartWhatsApp(cart: AbandonedCart) {
  return sendWhatsAppTemplate(
    cart.customerPhone,
    process.env.WHATSAPP_ABANDONED_TEMPLATE_NAME,
    [
      cart.customerName || "Customer",
      cart.recoveryCode,
      cart.checkoutUrl,
    ]
  );
}
