/**
 * GET /api/admin/orders  → list orders newest first, with tracking fields.
 * Used by the Orders admin tab (order fulfilment portal).
 */

import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { data, error } = await supabaseAdmin()
    .from("orders")
    .select(
      "id, order_number, created_at, customer_name, customer_email, customer_phone, customer_instagram, delivery_address, items, subtotal, shipping, total, payment_method, prepaid_amount, status, tracking_id, courier_partner, tracking_url, shipped_at, delivered_at, notes"
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rows: data ?? [] });
}
