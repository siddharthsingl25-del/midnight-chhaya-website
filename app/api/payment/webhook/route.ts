/**
 * POST /api/payment/webhook
 *
 * Razorpay server-to-server webhook receiver. This is the safety net
 * behind /api/payment/verify — verify runs from the customer's browser,
 * and if they close the tab before the fetch lands, the order never gets
 * booked. This route runs independently: Razorpay POSTs it whenever a
 * payment succeeds, so orders get saved even when the customer's browser
 * dies mid-checkout.
 *
 * Setup (do this once in Razorpay dashboard):
 *   1. Settings → Webhooks → Add New Webhook
 *   2. URL:    https://midnight-chhaya-website.vercel.app/api/payment/webhook
 *   3. Secret: pick a strong random string, add it to Vercel env as
 *              RAZORPAY_WEBHOOK_SECRET
 *   4. Events: check "payment.captured"
 *   5. Save
 *
 * Idempotent by design: the first thing we do is look up the payment id
 * in the orders table. If we've already recorded it (because verify ran
 * successfully from the browser), we no-op and return 200 immediately —
 * no double insert, no double ntfy, no double email.
 *
 * If we haven't seen the payment, we reconstruct the order from
 * pending_orders (customer name/email/items/address were persisted there
 * when create-order fired), decrement stock, insert the order row, and
 * fire the merchant ntfy + customer confirmation email.
 */

import crypto from "crypto";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendMerchantAlert } from "@/lib/merchantAlert";
import {
  sendOrderConfirmationEmail,
  sendOrderConfirmationWhatsApp,
  type OrderSnapshot,
} from "@/lib/notifications";

type WebhookPayload = {
  event: string;
  payload?: {
    payment?: {
      entity?: {
        id: string;
        order_id: string;
        amount: number;
        status: string;
        method?: string;
        email?: string;
        contact?: string;
        notes?: Record<string, string>;
      };
    };
  };
};

type PendingOrder = {
  razorpay_order_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_instagram: string;
  delivery_address: string;
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
  completed_at: string | null;
};

export async function POST(req: Request) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[webhook] RAZORPAY_WEBHOOK_SECRET not set");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 }
    );
  }

  // Read the raw body — signature is HMAC of the exact bytes, so JSON.parse
  // first would break verification.
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  const expected = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  const sigBuf = Buffer.from(signature, "hex");
  const expBuf = Buffer.from(expected, "hex");
  if (
    sigBuf.length !== expBuf.length ||
    !crypto.timingSafeEqual(sigBuf, expBuf)
  ) {
    console.error("[webhook] signature mismatch");
    return NextResponse.json({ error: "Bad signature" }, { status: 401 });
  }

  let body: WebhookPayload;
  try {
    body = JSON.parse(rawBody) as WebhookPayload;
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  // Only care about successful payments. Everything else is silently
  // ACKed — Razorpay will retry 5xx responses so we must not return
  // errors on events we intentionally ignore.
  if (body.event !== "payment.captured") {
    return NextResponse.json({ ok: true, ignored: body.event });
  }

  const payment = body.payload?.payment?.entity;
  if (!payment?.id || !payment.order_id) {
    return NextResponse.json({ ok: true, ignored: "no-payment-entity" });
  }

  const paymentId = payment.id;
  const razorpayOrderId = payment.order_id;
  const sb = supabaseAdmin();

  // 1. Idempotency check — has the browser-side verify already booked
  // this order? If so, silently no-op.
  const { data: existing } = await sb
    .from("orders")
    .select("id, order_number")
    .eq("razorpay_payment_id", paymentId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      ok: true,
      alreadyProcessed: true,
      orderNumber: existing.order_number,
    });
  }

  // 2. Rebuild the order from pending_orders — that row was written
  // when create-order fired and contains the full customer + cart snapshot.
  const { data: pending } = await sb
    .from("pending_orders")
    .select(
      "razorpay_order_id, customer_name, customer_email, customer_phone, customer_instagram, delivery_address, items, subtotal, shipping, total, completed_at"
    )
    .eq("razorpay_order_id", razorpayOrderId)
    .maybeSingle<PendingOrder>();

  if (!pending) {
    // No pending row → cannot reconstruct the order (would happen only
    // if the pending upsert failed on create-order). Alert the merchant
    // so they can look it up in Razorpay manually.
    void sendMerchantAlert({
      title: `MANUAL REVIEW - webhook orphan (${paymentId})`,
      priority: "max",
      tags: "warning,money_with_wings",
      body:
        `Razorpay webhook received a payment but no pending_orders row exists.\n\n` +
        `Payment ID: ${paymentId}\n` +
        `Razorpay order: ${razorpayOrderId}\n` +
        `Amount: Rs${Math.round((payment.amount ?? 0) / 100)}\n` +
        `Look it up in Razorpay dashboard and add manually.`,
    });

    return NextResponse.json(
      {
        ok: true,
        warning: "no-pending-row",
        paymentId,
      },
      { status: 200 }
    );
  }

  // 3. Decrement stock for every line. Chain stock too. Idempotency-wise,
  // if this webhook races with verify, only one of them will succeed at
  // inserting the orders row (razorpay_payment_id is UNIQUE); the loser
  // returns the alreadyProcessed path above on the retry. Between the
  // decrement and the insert there's a tiny window — we accept a rare
  // "1 stock unit gets decremented twice" as the price of never losing
  // an order.
  type Item = {
    slug: string;
    name: string;
    qty: number;
    chainId?: string | null;
    chainName?: string | null;
    unitPrice: number;
  };
  const items = pending.items ?? [];
  const appliedProducts: { slug: string; qty: number }[] = [];
  const appliedChains: { id: string; qty: number }[] = [];
  let stockFailure = "";

  for (const it of items as Item[]) {
    if (!it.slug || !it.qty || it.qty <= 0) continue;
    const { error } = await sb.rpc("decrement_stock", {
      p_slug: it.slug,
      p_qty: it.qty,
    });
    if (error) {
      stockFailure = `product ${it.slug}: ${error.message}`;
      break;
    }
    appliedProducts.push({ slug: it.slug, qty: it.qty });
  }

  if (!stockFailure) {
    const chainQty = new Map<string, number>();
    for (const it of items as Item[]) {
      if (!it.chainId || !it.qty || it.qty <= 0) continue;
      chainQty.set(it.chainId, (chainQty.get(it.chainId) ?? 0) + it.qty);
    }
    for (const [id, qty] of chainQty) {
      const { error } = await sb.rpc("decrement_chain_stock", {
        p_chain_id: id,
        p_qty: qty,
      });
      if (error) {
        stockFailure = `chain ${id}: ${error.message}`;
        break;
      }
      appliedChains.push({ id, qty });
    }
  }

  // 4. Insert the order row. If a race with verify caused a duplicate
  // key error, treat it as "already processed" — roll back our stock
  // decrement so we don't double-decrement.
  const paymentMethod: "online" | "cod" = payment.method === "cod" ? "cod" : "online";
  const deliveryAddress = pending.delivery_address ?? "";
  const { data: orderRow, error: orderErr } = await sb
    .from("orders")
    .insert({
      razorpay_payment_id: paymentId,
      razorpay_order_id: razorpayOrderId,
      payment_method: paymentMethod,
      prepaid_amount: Math.round((payment.amount ?? 0) / 100),
      customer_name: pending.customer_name,
      customer_email: pending.customer_email,
      customer_phone: pending.customer_phone,
      customer_instagram: pending.customer_instagram,
      delivery_address: deliveryAddress,
      items: pending.items,
      subtotal: pending.subtotal,
      shipping: pending.shipping,
      total: pending.total,
      notes: `Recovered via Razorpay webhook (customer's browser closed before verify ran).`,
    })
    .select("order_number")
    .single();

  if (orderErr) {
    // Duplicate key → verify raced us to the punch. Roll back stock, no-op.
    if (orderErr.code === "23505") {
      for (const { slug, qty } of appliedProducts) {
        const { data } = await sb
          .from("inventory")
          .select("stock")
          .eq("slug", slug)
          .maybeSingle();
        const next = (data?.stock ?? 0) + qty;
        await sb
          .from("inventory")
          .upsert({ slug, stock: next, updated_at: new Date().toISOString() });
      }
      for (const { id, qty } of appliedChains) {
        const { data } = await sb
          .from("chain_options")
          .select("stock")
          .eq("id", id)
          .maybeSingle();
        const next = (data?.stock ?? 0) + qty;
        await sb
          .from("chain_options")
          .update({ stock: next, updated_at: new Date().toISOString() })
          .eq("id", id);
      }
      return NextResponse.json({ ok: true, raced: true, paymentId });
    }

    // Real error — merchant needs to know so they can recover manually.
    console.error("[webhook] orders.insert failed", paymentId, orderErr);
    void sendMerchantAlert({
      title: `MANUAL REVIEW - webhook insert failed (${paymentId})`,
      priority: "max",
      tags: "warning,money_with_wings",
      body:
        `Payment succeeded but the webhook could not save the order.\n\n` +
        `Payment ID: ${paymentId}\n` +
        `Razorpay order: ${razorpayOrderId}\n` +
        `Reason: ${orderErr.message}\n\n` +
        `Customer: ${pending.customer_name} · ${pending.customer_email} · ${pending.customer_phone}\n`,
    });

    return NextResponse.json(
      { error: "insert-failed", details: orderErr.message },
      { status: 500 }
    );
  }

  const orderNumber = orderRow?.order_number ?? paymentId;

  // 5. Mark the pending row as completed so the abandoned-cart cron
  // doesn't chase this customer.
  void sb
    .from("pending_orders")
    .update({ completed_at: new Date().toISOString() })
    .eq("razorpay_order_id", razorpayOrderId);

  // 6. Fire the merchant ntfy — this is the whole point of this route.
  const itemsSummary = (pending.items as Item[])
    .map((it) => `${it.name} x${it.qty}`)
    .join(", ");
  void sendMerchantAlert({
    title: `${orderNumber} - Paid (webhook recovered)`,
    priority: "high",
    tags: "shopping_bags,sparkles",
    orderNumber,
    body:
      `Order: ${orderNumber}\n` +
      `Payment ID: ${paymentId}\n` +
      `Amount: Rs${pending.total}\n\n` +
      `Customer: ${pending.customer_name}\n` +
      `Phone: ${pending.customer_phone}\n` +
      `Email: ${pending.customer_email}\n` +
      (deliveryAddress ? `Address: ${deliveryAddress.replace(/\n/g, ", ")}\n` : "") +
      `\n` +
      `Items: ${itemsSummary}\n\n` +
      `Recovered via Razorpay webhook — customer's browser closed before ` +
      `the normal verify flow could run. All details captured, order is ` +
      `ready to ship as usual.`,
  });

  // 7. Customer confirmation — fire and forget.
  if (pending.customer_email) {
    const snapshot: OrderSnapshot = {
      orderNumber,
      paymentId,
      customer: {
        name: pending.customer_name,
        email: pending.customer_email,
        phone: pending.customer_phone,
      },
      items: pending.items,
      subtotal: pending.subtotal,
      shipping: pending.shipping,
      total: pending.total,
      address: deliveryAddress,
    };
    void Promise.allSettled([
      sendOrderConfirmationEmail(snapshot),
      sendOrderConfirmationWhatsApp(snapshot),
    ]);
  }

  return NextResponse.json({
    ok: true,
    recovered: true,
    orderNumber,
    paymentId,
  });
}

// Razorpay always POSTs; other verbs shouldn't hit this URL.
export async function GET() {
  return NextResponse.json(
    { ok: true, message: "Razorpay webhook endpoint. POST only." },
    { status: 200 }
  );
}
