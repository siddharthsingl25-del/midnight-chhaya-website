/**
 * POST /api/checkout/validate-code
 *
 * Used by the checkout client to show "X% off, you'd save ₹Y" before
 * the customer hits Pay. Looks up the code in pending_orders (where
 * the abandoned-cart cron stores recovery codes) and returns the
 * percentage off if it's valid and unused.
 *
 * Body: { code: string, subtotal: number }
 * Response:
 *   { valid: true, percentOff: number, amountOff: number }
 *   { valid: false, error: string }
 */

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  let body: { code?: string; subtotal?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ valid: false, error: "Bad JSON" }, { status: 400 });
  }

  const code = (body.code ?? "").trim().toUpperCase();
  const subtotal = Number(body.subtotal ?? 0);
  if (!code) {
    return NextResponse.json({ valid: false, error: "Code is empty" });
  }
  if (!Number.isFinite(subtotal) || subtotal <= 0) {
    return NextResponse.json({ valid: false, error: "Invalid cart total" });
  }

  const { data, error } = await supabaseAdmin()
    .from("pending_orders")
    .select("recovery_code, recovery_percent_off, completed_at, recovered_at")
    .eq("recovery_code", code)
    .is("completed_at", null)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ valid: false, error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ valid: false, error: "Code not found or already used" });
  }

  // Codes expire 7 days after the recovery email was sent.
  if (data.recovered_at) {
    const expires = new Date(data.recovered_at).getTime() + 7 * 24 * 3600 * 1000;
    if (Date.now() > expires) {
      return NextResponse.json({ valid: false, error: "This code has expired" });
    }
  }

  const percentOff = Math.max(0, Math.min(50, data.recovery_percent_off ?? 10));
  const amountOff = Math.round((subtotal * percentOff) / 100);

  return NextResponse.json({ valid: true, percentOff, amountOff });
}
