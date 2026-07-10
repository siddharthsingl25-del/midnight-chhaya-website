/**
 * GET /api/promo?code=FIRST10
 *
 * Public read for a single promo code. Returns just what the homepage
 * banner needs: percent off, flat amount off, min subtotal, and how
 * many uses are left. Used to keep the "only N left" line honest as
 * customers claim the offer.
 */

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = (url.searchParams.get("code") ?? "").trim().toUpperCase();
  if (!code) return NextResponse.json({ error: "code required" }, { status: 400 });

  const { data, error } = await supabaseAdmin()
    .from("promo_codes")
    .select("code, percent_off, flat_amount_off, min_subtotal, max_uses, times_used, active")
    .eq("code", code)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || !data.active) {
    return NextResponse.json({ active: false });
  }

  const usesLeft =
    data.max_uses != null ? Math.max(0, data.max_uses - (data.times_used ?? 0)) : null;

  return NextResponse.json({
    code: data.code,
    percentOff: data.percent_off ?? 0,
    flatAmountOff: data.flat_amount_off ?? 0,
    minSubtotal: data.min_subtotal ?? 0,
    maxUses: data.max_uses,
    timesUsed: data.times_used ?? 0,
    usesLeft,
    active: data.active,
  });
}
