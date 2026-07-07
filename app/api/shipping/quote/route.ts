/**
 * POST /api/shipping/quote
 *
 * Body: { pincode: string, subtotal?: number }
 * Returns:
 *   { pincode, free: true, couriers: [] }              — free shipping
 *   { pincode, couriers: [{...}, {...}, ...] }         — real list
 *   { pincode, fallback: true, couriers: [...] }       — Shiprocket down
 *                                                        or unserviceable,
 *                                                        one synthetic
 *                                                        "Standard" option
 *
 * The customer picks a courier from the returned list and pays that
 * courier's exact rate. Same behaviour as Shiprocket's own calculator.
 */

import { NextResponse } from "next/server";
import { getCourierOptions, type CourierOption } from "@/lib/shiprocket";
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
      free: true,
      couriers: [],
    });
  }

  try {
    const couriers = await getCourierOptions(pincode);
    if (couriers.length === 0) {
      return NextResponse.json({
        pincode,
        fallback: true,
        notServiceable: true,
        couriers: [fallbackOption()],
      });
    }
    return NextResponse.json({
      pincode,
      free: false,
      couriers: couriers.slice(0, 12), // cap at 12 options for the UI
    });
  } catch (e) {
    console.error("[shipping.quote]", e);
    return NextResponse.json({
      pincode,
      fallback: true,
      couriers: [fallbackOption()],
    });
  }
}

function fallbackOption(): CourierOption {
  return {
    courierCompanyId: -1,
    courierName: "Standard shipping",
    rate: SHIPPING_FEE,
    etdDays: null,
    isSurface: true,
    recommended: false,
  };
}
