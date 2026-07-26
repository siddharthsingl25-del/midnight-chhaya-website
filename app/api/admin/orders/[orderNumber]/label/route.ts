/**
 * GET /api/admin/orders/[orderNumber]/label
 *
 * Print-ready HTML shipping label for a SINGLE order. 9×9 cm, laid out
 * on an A4 sheet (top-left cell), auto-triggers the browser print dialog.
 *
 * See lib/shippingLabel.ts for the shared renderer used by the bulk route.
 */

import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabase";
import { renderLabelPage, type LabelOrder } from "@/lib/shippingLabel";

type Params = { params: Promise<{ orderNumber: string }> };

export async function GET(_req: Request, { params }: Params) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { orderNumber } = await params;
  const ref = decodeURIComponent(orderNumber).trim().toUpperCase();
  const withPrefix = ref.startsWith("MC-") ? ref : `MC-${ref}`;

  const sb = supabaseAdmin();
  const { data: order, error } = await sb
    .from("orders")
    .select(
      "order_number, customer_name, customer_phone, delivery_address, payment_method, total, items"
    )
    .eq("order_number", withPrefix)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!order) {
    return NextResponse.json({ error: `Order ${withPrefix} not found` }, { status: 404 });
  }

  const html = renderLabelPage([order as LabelOrder], `Label · ${withPrefix}`);
  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
