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

type Item = { slug: string; qty: number; chainId?: string };
type Body = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  items: Item[];
  orderText: string;
  titleSummary: string;
};

export async function POST(req: Request) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
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
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");
  if (expected !== razorpay_signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // 2. Decrement stock for every line, rolling back on partial failure --------
  const items = Array.isArray(body.items) ? body.items : [];
  const sb = supabaseAdmin();
  const applied: { slug: string; qty: number }[] = [];
  let stockFailureSlug: string | null = null;

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
    applied.push({ slug, qty });
  }

  if (stockFailureSlug) {
    // Roll back what we already decremented.
    for (const { slug, qty } of applied) {
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
    // Notify the merchant — customer has paid but stock check failed.
    // They'll need to refund or restock; we surface it loudly.
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
          `Failing item: ${stockFailureSlug}\n\n` +
          (body.orderText ?? ""),
      });
    } catch {
      /* swallowed */
    }
    return NextResponse.json(
      {
        error: "Stock unavailable after payment",
        slug: stockFailureSlug,
        paymentId: razorpay_payment_id,
      },
      { status: 409 }
    );
  }

  // 3. Send the standard order notification -----------------------------------
  try {
    const asciiTitle =
      (body.titleSummary || "Paid order").replace(/[^\x20-\x7E]/g, "") ||
      "Paid order";
    await fetch(`https://ntfy.sh/${SITE.notifyTopic}`, {
      method: "POST",
      headers: {
        Title: asciiTitle,
        Priority: "high",
        Tags: "shopping_bags,sparkles",
      },
      body:
        `Payment ID: ${razorpay_payment_id}\n\n` + (body.orderText ?? "(no order text)"),
    });
  } catch {
    /* swallowed — order is already booked + paid */
  }

  return NextResponse.json({ ok: true, paymentId: razorpay_payment_id });
}
