/**
 * GET /api/cron/abandoned-cart
 *
 * Vercel cron entry point. Configured in vercel.json to run once a day.
 * Finds pending_orders rows that:
 *   - were created at least 1 hour ago (give the customer time to finish)
 *   - haven't been paid (completed_at IS NULL)
 *   - haven't been emailed yet (recovered_at IS NULL)
 *
 * For each, generates a unique recovery code, stores it on the row,
 * and sends an email + WhatsApp with the code. Customer can use the
 * code at checkout for 10% off (validated against pending_orders).
 *
 * Auth: Vercel sets a CRON_SECRET env var; we accept either that as
 * Authorization: Bearer, or no auth at all when CRON_SECRET is unset
 * (local dev / manual triggers).
 */

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  sendAbandonedCartEmail,
  sendAbandonedCartWhatsApp,
} from "@/lib/notifications";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

function makeRecoveryCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `BACK10-${suffix}`;
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization") || "";
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const sb = supabaseAdmin();

  // Find pending orders 1h+ old that haven't been paid or recovered yet.
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const { data: pending, error } = await sb
    .from("pending_orders")
    .select("*")
    .lte("created_at", oneHourAgo)
    .gte("created_at", sevenDaysAgo)
    .is("completed_at", null)
    .is("recovered_at", null)
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: Array<{
    razorpay_order_id: string;
    email?: string;
    whatsapp?: string;
    error?: string;
  }> = [];

  for (const row of pending ?? []) {
    if (!row.customer_email && !row.customer_phone) continue; // nothing to send to
    const code = makeRecoveryCode();
    const itemSummary = (row.items as Array<{ name: string; qty: number; chainName?: string }>)
      .map((it) => {
        const chain = it.chainName ? ` (Chain: ${it.chainName})` : "";
        return `• ${it.name}${chain} × ${it.qty}`;
      })
      .join("\n");

    const recoveryCart = {
      customerName: row.customer_name as string,
      customerEmail: row.customer_email as string,
      customerPhone: row.customer_phone as string,
      itemSummary,
      total: row.total as number,
      recoveryCode: code,
      percentOff: 10,
      checkoutUrl: `${SITE.url}/checkout`,
    };

    const [emailRes, waRes] = await Promise.allSettled([
      sendAbandonedCartEmail(recoveryCart),
      sendAbandonedCartWhatsApp(recoveryCart),
    ]);

    const summarize = (r: PromiseSettledResult<{ ok: boolean; skipped?: boolean; error?: string }>) => {
      if (r.status === "rejected") return `threw (${String(r.reason)})`;
      if (r.value.skipped) return "skipped";
      if (!r.value.ok) return r.value.error ?? "failed";
      return "sent";
    };

    // Update the row regardless — we don't want to retry on a partial
    // failure tomorrow and double-send to a customer who already got it.
    await sb
      .from("pending_orders")
      .update({
        recovery_code: code,
        recovery_percent_off: 10,
        recovered_at: new Date().toISOString(),
      })
      .eq("razorpay_order_id", row.razorpay_order_id);

    results.push({
      razorpay_order_id: row.razorpay_order_id as string,
      email: summarize(emailRes),
      whatsapp: summarize(waRes),
    });
  }

  return NextResponse.json({
    ok: true,
    scanned: pending?.length ?? 0,
    sent: results.length,
    results,
  });
}
