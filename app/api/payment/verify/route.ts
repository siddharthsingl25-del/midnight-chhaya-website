/**
 * POST /api/payment/verify
 *
 * Called by the checkout client after Razorpay's checkout modal fires
 * its success handler.
 *
 * Body: {
 *   razorpay_payment_id, razorpay_order_id, razorpay_signature,
 *   items: [{ slug, qty, chainId? }],
 *   orderText: string,    -- plaintext order body for the ntfy push
 *   titleSummary: string  -- short title for the ntfy push (ASCII-safe)
 * }
 *
 * Flow:
 *   1. Verify the signature: HMAC-SHA256 of `${order_id}|${payment_id}`
 *      with the Razorpay key_secret should equal the supplied signature.
 *      If not, reject — payment isn't trustworthy.
 *   2. Atomically decrement stock for every line via the Postgres RPC.
 *      Roll back applied decrements if any line is out of stock.
 *      (This window is small; we already stock-checked in create-order.)
 *   3. Send the ntfy push notification with the full order text.
 *
 * If the post-payment stock decrement somehow fails (very rare race),
 * the customer has already paid — we still send the ntfy ping but tag
 * it MANUAL so the merchant knows a refund / restock decision is needed.
 */

import crypto from "crypto";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { SITE } from "@/lib/site";
import {
  sendOrderConfirmationEmail,
  sendOrderConfirmationWhatsApp,
  type OrderSnapshot,
} from "@/lib/notifications";

type Item = { slug: string; qty: number; chainId?: string };
type Body = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  items: Item[];
  orderText: string;
  titleSummary: string;
  /** Structured order data for the customer-facing email + WhatsApp + DB row. */
  snapshot?: Omit<OrderSnapshot, "paymentId" | "orderNumber">;
  /** Optional fields persisted on the order row for merchant lookup. */
  instagram?: string;
  notes?: string;
};

export async function POST(req: Request) {
  /* NEXT_PUBLIC_BYPASS_PAYMENT=1 → skip Razorpay signature check.
   * Matches the same flag in create-order. */
  const bypass = process.env.NEXT_PUBLIC_BYPASS_PAYMENT === "1";

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!bypass && !keySecret) {
    return NextResponse.json(
      { error: "Razorpay not configured" },
      { status: 500 }
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = body;
  if (
    !razorpay_payment_id ||
    !razorpay_order_id ||
    !razorpay_signature
  ) {
    return NextResponse.json({ error: "Missing signature fields" }, { status: 400 });
  }

  // 1. Verify HMAC signature ---------------------------------------------------
  if (!bypass) {
    const expected = crypto
      .createHmac("sha256", keySecret!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");
    if (expected !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
  }

  // 2. Decrement stock for every line, rolling back on partial failure --------
  // Both product inventory (slug-keyed) and chain inventory (id-keyed). If
  // either fails partway through, roll back whatever we already touched.
  const items = Array.isArray(body.items) ? body.items : [];
  const sb = supabaseAdmin();
  const appliedProducts: { slug: string; qty: number }[] = [];
  const appliedChains: { id: string; qty: number }[] = [];
  let stockFailureSlug: string | null = null;
  let stockFailureChainId: string | null = null;

  for (const { slug, qty } of items) {
    if (typeof slug !== "string" || typeof qty !== "number" || qty <= 0) continue;
    const { error } = await sb.rpc("decrement_stock", {
      p_slug: slug,
      p_qty: qty,
    });
    if (error) {
      stockFailureSlug = slug;
      break;
    }
    appliedProducts.push({ slug, qty });
  }

  if (!stockFailureSlug) {
    // Aggregate chain qty across lines (a chain id may repeat).
    const chainQty = new Map<string, number>();
    for (const { chainId, qty } of items) {
      if (typeof chainId !== "string" || !chainId) continue;
      if (typeof qty !== "number" || qty <= 0) continue;
      chainQty.set(chainId, (chainQty.get(chainId) ?? 0) + qty);
    }
    for (const [id, qty] of chainQty) {
      const { error } = await sb.rpc("decrement_chain_stock", {
        p_chain_id: id,
        p_qty: qty,
      });
      if (error) {
        stockFailureChainId = id;
        break;
      }
      appliedChains.push({ id, qty });
    }
  }

  if (stockFailureSlug || stockFailureChainId) {
    // Roll back every product decrement.
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
    // Roll back every chain decrement.
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
    const failingThing = stockFailureSlug
      ? `product ${stockFailureSlug}`
      : `chain ${stockFailureChainId}`;
    // Notify the merchant — customer has paid but stock check failed.
    try {
      await fetch(`https://ntfy.sh/${SITE.notifyTopic}`, {
        method: "POST",
        headers: {
          Title: `MANUAL REVIEW - Paid but stock failed (${razorpay_payment_id})`,
          Priority: "max",
          Tags: "warning,money_with_wings",
        },
        body:
          `Payment succeeded but post-payment stock decrement failed.\n\n` +
          `Payment ID: ${razorpay_payment_id}\n` +
          `Razorpay order: ${razorpay_order_id}\n` +
          `Failing item: ${failingThing}\n\n` +
          (body.orderText ?? ""),
      });
    } catch {
      /* swallowed */
    }
    return NextResponse.json(
      {
        error: "Stock unavailable after payment",
        slug: stockFailureSlug ?? stockFailureChainId,
        paymentId: razorpay_payment_id,
      },
      { status: 409 }
    );
  }

  // 2b. Mark the pending-orders row as completed so the abandoned-cart
  // cron doesn't try to recover an order that was just paid. If a
  // recovery code was applied on this cart, also mark the ORIGINAL
  // recovery row as completed so the same code can't be used again.
  try {
    const completedAt = new Date().toISOString();
    const { data: currentPending } = await sb
      .from("pending_orders")
      .select("recovery_code")
      .eq("razorpay_order_id", razorpay_order_id)
      .maybeSingle();
    await sb
      .from("pending_orders")
      .update({ completed_at: completedAt })
      .eq("razorpay_order_id", razorpay_order_id);
    if (currentPending?.recovery_code) {
      await sb
        .from("pending_orders")
        .update({ completed_at: completedAt })
        .eq("recovery_code", currentPending.recovery_code)
        .is("completed_at", null);
    }
  } catch {
    /* swallowed — non-critical */
  }

  // 3. Persist the order row → gives us the human-readable order number ------
  // Falls back to the raw payment id if the insert fails (rare); the order is
  // already paid, so we never want to error out here.
  let orderNumber: string = razorpay_payment_id;
  if (body.snapshot) {
    const { data: orderRow, error: orderErr } = await sb
      .from("orders")
      .insert({
        razorpay_payment_id,
        razorpay_order_id,
        customer_name: body.snapshot.customer.name ?? "",
        customer_email: body.snapshot.customer.email ?? "",
        customer_phone: body.snapshot.customer.phone ?? "",
        customer_instagram: body.instagram ?? "",
        delivery_address: body.snapshot.address ?? "",
        items: body.snapshot.items,
        subtotal: body.snapshot.subtotal,
        shipping: body.snapshot.shipping,
        total: body.snapshot.total,
        notes: body.notes ?? "",
      })
      .select("order_number")
      .single();
    if (orderErr) {
      console.error("[orders.insert]", razorpay_payment_id, orderErr.message);
    } else if (orderRow?.order_number) {
      orderNumber = orderRow.order_number;
    }
  }

  // 4. Merchant push (ntfy) — title carries the order number so it shows on
  // your lock screen and you can match it to a customer support query --------
  try {
    const asciiTitleSummary =
      (body.titleSummary || "Paid order").replace(/[^\x20-\x7E]/g, "") ||
      "Paid order";
    const asciiTitle = `${orderNumber} - ${asciiTitleSummary}`;
    await fetch(`https://ntfy.sh/${SITE.notifyTopic}`, {
      method: "POST",
      headers: {
        Title: asciiTitle,
        Priority: "high",
        Tags: "shopping_bags,sparkles",
      },
      body:
        `Order: ${orderNumber}\nPayment ID: ${razorpay_payment_id}\n\n` +
        (body.orderText ?? "(no order text)"),
    });
  } catch {
    /* swallowed — order is already booked + paid */
  }

  // 5. Customer-facing confirmation: email + WhatsApp -------------------------
  // Fire and forget — order is already paid; failures here must not break the
  // success response. Results are logged so the merchant can see misconfigs.
  if (body.snapshot) {
    const snapshot: OrderSnapshot = {
      ...body.snapshot,
      paymentId: razorpay_payment_id,
      orderNumber,
    };
    const [emailRes, waRes] = await Promise.allSettled([
      sendOrderConfirmationEmail(snapshot),
      sendOrderConfirmationWhatsApp(snapshot),
    ]);
    const summarize = (
      label: string,
      r: PromiseSettledResult<{ ok: boolean; skipped?: boolean; error?: string }>
    ) => {
      if (r.status === "rejected") return `${label}: threw (${String(r.reason)})`;
      if (r.value.skipped) return `${label}: skipped (env not set)`;
      if (!r.value.ok) return `${label}: ${r.value.error ?? "failed"}`;
      return `${label}: sent`;
    };
    console.log(
      "[order-confirm]",
      orderNumber,
      summarize("email", emailRes),
      "|",
      summarize("whatsapp", waRes)
    );
  }

  return NextResponse.json({
    ok: true,
    paymentId: razorpay_payment_id,
    orderNumber,
  });
}
