/**
 * POST /api/feedback
 *
 * Customer-facing endpoint. Accepts:
 *   { orderNumber: "MC-00042", rating: 1..5, comment: "..." }
 *
 * Resolves the order_number → razorpay_payment_id and inserts a row
 * into public.feedback. No auth — the rate limiter is the obscurity
 * of the order number, which a customer only learns from their own
 * confirmation email. Bots randomly guessing MC-XXXXX would be rare
 * enough that a simple sanity check is fine for an MVP.
 */

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  let body: { orderNumber?: string; rating?: number; comment?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const orderNumber = (body.orderNumber ?? "").trim().toUpperCase();
  const rating = Number(body.rating);
  const comment = (body.comment ?? "").trim().slice(0, 2000);

  if (!orderNumber.startsWith("MC-")) {
    return NextResponse.json({ error: "Invalid order number" }, { status: 400 });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be 1–5" }, { status: 400 });
  }

  const sb = supabaseAdmin();
  const { data: order, error: orderErr } = await sb
    .from("orders")
    .select("razorpay_payment_id")
    .eq("order_number", orderNumber)
    .maybeSingle();
  if (orderErr) {
    return NextResponse.json({ error: orderErr.message }, { status: 500 });
  }
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const { error: insertErr } = await sb.from("feedback").insert({
    razorpay_payment_id: order.razorpay_payment_id,
    rating,
    comment,
  });
  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
