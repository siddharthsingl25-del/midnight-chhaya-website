/**
 * GET /api/admin/shipping-debug?pincode=110001
 *
 * Diagnostic endpoint for the Shiprocket integration. Admin-cookie
 * gated. Reports which env vars are set (without values), whether auth
 * works, and what Shiprocket returns for a test pincode.
 */

import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/adminAuth";
import { getShippingQuote } from "@/lib/shiprocket";

export async function GET(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const url = new URL(req.url);
  const pincode = url.searchParams.get("pincode") || "110001";

  const emailSet = Boolean(process.env.SHIPROCKET_EMAIL);
  const passwordSet = Boolean(process.env.SHIPROCKET_PASSWORD);
  const pickup = process.env.SHIPROCKET_PICKUP_PINCODE || "141010(default)";

  if (!emailSet || !passwordSet) {
    return NextResponse.json({
      envVars: { emailSet, passwordSet, pickup },
      error: "Shiprocket env vars missing — set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD in Vercel.",
    });
  }

  try {
    const quote = await getShippingQuote(pincode);
    return NextResponse.json({
      envVars: { emailSet, passwordSet, pickup },
      testPincode: pincode,
      quote,
      ok: quote != null,
      note: quote == null ? "Auth succeeded but no couriers found for this pincode." : "All good.",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({
      envVars: { emailSet, passwordSet, pickup },
      testPincode: pincode,
      error: message,
    });
  }
}
