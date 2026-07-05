/**
 * Shiprocket helper.
 *
 * Two entry points:
 *   - getShippingQuote(pincode) → real rate for that customer pincode
 *   - Auth is handled internally, token cached in-process for ~9 days
 *
 * Env vars:
 *   SHIPROCKET_EMAIL           — API user email (Shiprocket → Settings → API)
 *   SHIPROCKET_PASSWORD        — API user password
 *   SHIPROCKET_PICKUP_PINCODE  — origin pincode (defaults to 141010 · Ludhiana)
 *
 * Failure behaviour: throws. The caller decides whether to fall back to the
 * flat ₹100 default so checkout never breaks because Shiprocket blipped.
 */

/** Fixed parcel spec — every Midnight Chhaya order is a small box under
 * Shiprocket's minimum billable weight. Change here if that ever varies. */
const PARCEL_WEIGHT_KG = 0.5;
const PARCEL_LENGTH_CM = 10; // 4 in
const PARCEL_BREADTH_CM = 10; // 4 in
const PARCEL_HEIGHT_CM = 5; // 2 in

const AUTH_URL = "https://apiv2.shiprocket.in/v1/external/auth/login";
const SERVICEABILITY_URL =
  "https://apiv2.shiprocket.in/v1/external/courier/serviceability/";

type CachedToken = { token: string; expiresAt: number };
let cachedToken: CachedToken | null = null;

function env() {
  return {
    email: process.env.SHIPROCKET_EMAIL ?? "",
    password: process.env.SHIPROCKET_PASSWORD ?? "",
    pickup: process.env.SHIPROCKET_PICKUP_PINCODE ?? "141010",
  };
}

async function getToken(force = false): Promise<string> {
  const { email, password } = env();
  if (!email || !password) {
    throw new Error("Shiprocket not configured");
  }
  if (!force && cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }
  const res = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Shiprocket auth failed (${res.status}): ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as { token?: string };
  if (!data.token) throw new Error("Shiprocket auth returned no token");
  // Shiprocket tokens last 10 days. Keep ours a day short so we refresh
  // before it dies. In serverless this cache is per-instance and cheap.
  cachedToken = { token: data.token, expiresAt: Date.now() + 9 * 24 * 3600 * 1000 };
  return data.token;
}

export type ShippingQuote = {
  courierName: string;
  rate: number; // total INR (rounded up to whole rupees)
  cod: boolean;
  etdDays: number | null; // estimated delivery days
};

type ShiprocketCourier = {
  courier_name: string;
  rate: number;
  cod: number;
  estimated_delivery_days?: string | number;
  recommended?: number;
};

export async function getShippingQuote(
  deliveryPincode: string,
  opts: { cod?: boolean } = {}
): Promise<ShippingQuote | null> {
  const { pickup } = env();
  const cod = opts.cod ?? false;

  const params = new URLSearchParams({
    pickup_postcode: pickup,
    delivery_postcode: deliveryPincode,
    weight: String(PARCEL_WEIGHT_KG),
    cod: cod ? "1" : "0",
    length: String(PARCEL_LENGTH_CM),
    breadth: String(PARCEL_BREADTH_CM),
    height: String(PARCEL_HEIGHT_CM),
  });

  const request = async (token: string) =>
    fetch(`${SERVICEABILITY_URL}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

  let res = await request(await getToken());
  if (res.status === 401 || res.status === 403) {
    // Token expired or revoked → force a fresh one and retry once.
    cachedToken = null;
    res = await request(await getToken(true));
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Shiprocket serviceability failed (${res.status}): ${text.slice(0, 200)}`
    );
  }

  const data = (await res.json()) as {
    data?: { available_courier_companies?: ShiprocketCourier[] };
  };
  const couriers = data?.data?.available_courier_companies ?? [];
  if (couriers.length === 0) return null; // pincode not serviceable

  // Prefer Shiprocket's recommended courier; fall back to the cheapest.
  const chosen =
    couriers.find((c) => c.recommended === 1) ??
    couriers.reduce<ShiprocketCourier>(
      (min, c) => (c.rate < min.rate ? c : min),
      couriers[0]
    );

  const etdDays =
    chosen.estimated_delivery_days != null
      ? Number(chosen.estimated_delivery_days) || null
      : null;

  return {
    courierName: chosen.courier_name,
    rate: Math.ceil(chosen.rate),
    cod,
    etdDays,
  };
}
