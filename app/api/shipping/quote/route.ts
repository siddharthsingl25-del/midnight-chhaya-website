/**
 * POST /api/shipping/quote
 *
 * Body: { pincode: string, subtotal?: number }
 * Returns: {
 *   pincode, rate, free, courierName, etdDays,
 *   fallback?: true       — set when Shiprocket errored / not serviceable
 *                           and we're returning the flat default instead
 * }
 *
 * Free-shipping threshold still overrides Shiprocket — if the customer's
 * subtotal is above SHIPPING_THRESHOLD, we return rate: 0 without hitting
 * the Shiprocket API at all.
 */

import { NextResponse } from "next/server";
import { getShippingQuote } from "@/lib/shiprocket";
import { SHIPPING_FEE, SHIPPING_THRESHOLD } from "@/lib/site";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    pincode?: string;
    subtotal?: number;
  };

  const pincode = String(body.pincode ?? "").trim();
  if (!/^\d{6}$/.test(pincode)) {
    return NextResponse.json(
      { error: "Enter a valid 6-digit pincode." },
      { status: 400 }
    );
  }

  const subtotal = Number(body.subtotal ?? 0);
  if (Number.isFinite(subtotal) && subtotal >= SHIPPING_THRESHOLD) {
    return NextResponse.json({
      pincode,
      rate: 0,
      free: true,
      courierName: "Free shipping",
      etdDays: null,
    });
  }

  try {
    const quote = await getShippingQuote(pincode);
    if (!quote) {
      return NextResponse.json({
        pincode,
        rate: SHIPPING_FEE,
        free: false,
        courierName: "Standard shipping",
        etdDays: null,
        fallback: true,
        notServiceable: true,
      });
    }
    return NextResponse.json({
      pincode,
      rate: quote.rate,
      free: false,
      courierName: quote.courierName,
      etdDays: quote.etdDays,
    });
  } catch (e) {
    console.error("[shipping.quote]", e);
    // Fail safe → flat fee so checkout still works.
    return NextResponse.json({
      pincode,
      rate: SHIPPING_FEE,
      free: false,
      courierName: "Standard shipping",
      etdDays: null,
      fallback: true,
    });
  }
}
