/**
 * POST /api/admin/cash-orders
 *
 * Records a manual / cash sale (e.g. a friend paying in person). It
 * lands in the SAME `orders` table as online sales, so the finance
 * dashboard sums both into one ledger.
 *
 * Body:
 *   {
 *     customer_name, customer_phone?, customer_instagram?,
 *     items: [{ slug, qty, chainId? }],
 *     merchant_cost?: number,         // optional override of cost basis
 *     amount_paid?: number,           // friend discount — what they
 *                                     // actually paid, may be < total
 *     occurred_at?: string,           // ISO date, defaults to today
 *     notes?: string,
 *     charge_shipping?: boolean,
 *   }
 */

import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/adminAuth";
import { logCashSale } from "@/lib/finance-actions";

type IncomingItem = { slug: string; qty: number; chainId?: string };
type Body = {
  customer_name?: string;
  customer_phone?: string;
  customer_instagram?: string;
  items: IncomingItem[];
  merchant_cost?: number | null;
  packaging_cost?: number | null;
  amount_paid?: number | null;
  occurred_at?: string;
  notes?: string;
  charge_shipping?: boolean;
};

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) {
    return NextResponse.json({ error: "No items" }, { status: 400 });
  }

  try {
    const result = await logCashSale({
      items,
      customerName: body.customer_name,
      customerPhone: body.customer_phone,
      customerInstagram: body.customer_instagram,
      merchantCost: body.merchant_cost,
      packagingCost: body.packaging_cost,
      amountPaid: body.amount_paid,
      occurredAt: body.occurred_at,
      notes: body.notes,
      chargeShipping: body.charge_shipping,
    });
    return NextResponse.json({
      ok: true,
      orderNumber: result.orderNumber,
      id: result.id,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Save failed";
    const status =
      message.startsWith("Unavailable:") || message.startsWith("Bad")
        ? 400
        : message.includes("Stock") || message.includes("Chain stock")
          ? 409
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
