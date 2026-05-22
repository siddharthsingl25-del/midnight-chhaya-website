/**
 * GET /api/cron/feedback
 *
 * Vercel cron entry point. Runs once a day. Finds paid orders that:
 *   - are at least 3 days old (assume the customer has the piece)
 *   - haven't had a feedback request sent (feedback_sent_at IS NULL)
 *
 * Sends an email + WhatsApp asking for a 1–5 star rating with a link
 * to /feedback/<orderNumber>.
 */

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  sendFeedbackRequestEmail,
  sendFeedbackRequestWhatsApp,
} from "@/lib/notifications";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization") || "";
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const sb = supabaseAdmin();
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString();
  const { data: orders, error } = await sb
    .from("orders")
    .select(
      "razorpay_payment_id, order_number, customer_name, customer_email, customer_phone"
    )
    .lte("created_at", threeDaysAgo)
    .is("feedback_sent_at", null)
    .eq("status", "paid")
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: Array<{
    order_number: string;
    email?: string;
    whatsapp?: string;
  }> = [];

  for (const o of orders ?? []) {
    if (!o.customer_email && !o.customer_phone) continue;
    const req = {
      orderNumber: o.order_number as string,
      customerName: o.customer_name as string,
      customerEmail: o.customer_email as string,
      customerPhone: o.customer_phone as string,
      feedbackUrl: `${SITE.url}/feedback/${o.order_number}`,
    };

    const [emailRes, waRes] = await Promise.allSettled([
      sendFeedbackRequestEmail(req),
      sendFeedbackRequestWhatsApp(req),
    ]);

    const summarize = (r: PromiseSettledResult<{ ok: boolean; skipped?: boolean; error?: string }>) => {
      if (r.status === "rejected") return `threw (${String(r.reason)})`;
      if (r.value.skipped) return "skipped";
      if (!r.value.ok) return r.value.error ?? "failed";
      return "sent";
    };

    await sb
      .from("orders")
      .update({ feedback_sent_at: new Date().toISOString() })
      .eq("razorpay_payment_id", o.razorpay_payment_id);

    results.push({
      order_number: o.order_number as string,
      email: summarize(emailRes),
      whatsapp: summarize(waRes),
    });
  }

  return NextResponse.json({
    ok: true,
    scanned: orders?.length ?? 0,
    sent: results.length,
    results,
  });
}
