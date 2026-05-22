/**
 * GET /api/admin/feedback → list every customer feedback row with
 * joined order info (order number, customer name).
 */

import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin()
    .from("feedback")
    .select(
      "id, rating, comment, created_at, razorpay_payment_id, orders(order_number, customer_name)"
    )
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rows: data ?? [] });
}
