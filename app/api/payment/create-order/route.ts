/**
 * POST /api/payment/create-order
 *
 * Called from the checkout client when the customer clicks "Pay".
 * Validates stock availability (without decrementing) and computes the
 * total server-side from authoritative data (the client cannot inflate
 * the amount), then creates a Razorpay order via the REST API.
 *
 * Returns { razorpayOrderId, amountPaise, keyId, currency } — the
 * client uses these to open Razorpay's checkout modal.
 *
 * Stock is NOT decremented yet. That happens only after payment is
 * verified in /api/payment/verify, so abandoned cart attempts don't
 * touch inventory.
 */

import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { supabaseAdmin } from "@/lib/supabase";
import { getAllProducts, getChain } from "@/lib/catalog";
import {
  ACTIVE_OFFER,
  COD_CHARGE,
  computeBogoDiscount,
  computeShippingForCart,
  offerActiveAt,
} from "@/lib/site";

type IncomingItem = { slug: string; qty: number; chainId?: string };

type Body = {
  items: IncomingItem[];
  customer: {
    name: string;
    instagram: string;
    phone: string;
    email: string;
  };
  /** Optional abandoned-cart recovery code (BACK10-XXXXXX). */
  discountCode?: string;
  /** 'online' (default) or 'cod'. For COD, the Razorpay charge covers
   * only shipping + the COD fee; the product subtotal is collected
   * as cash on delivery. */
  paymentMethod?: "online" | "cod";
};

export async function POST(req: Request) {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return NextResponse.json(
      { error: "Razorpay not configured" },
      { status: 500 }
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) {
    return NextResponse.json({ error: "Empty cart" }, { status: 400 });
  }

  // 1. Resolve every line server-side. Reject if a slug doesn't exist or
  //    has a null price (inquire-only).
  const products = await getAllProducts();
  const lines: {
    slug: string;
    qty: number;
    chainId: string | null;
    chainName: string | null;
    unitPaise: number;
    name: string;
    category: string;
  }[] = [];
  for (const { slug, qty, chainId } of items) {
    if (typeof slug !== "string" || typeof qty !== "number" || qty <= 0) {
      return NextResponse.json({ error: "Bad item" }, { status: 400 });
    }
    const product = products.find((p) => p.slug === slug);
    if (!product || product.price == null) {
      return NextResponse.json({ error: `Unavailable: ${slug}` }, { status: 400 });
    }
    const chain = chainId ? await getChain(chainId) : null;
    const unitInr = product.price + (chain?.priceModifier ?? 0);
    lines.push({
      slug,
      qty,
      chainId: chain?.id ?? null,
      chainName: chain?.name ?? null,
      unitPaise: Math.round(unitInr * 100),
      name: product.name,
      category: product.category,
    });
  }

  // 2. Stock check — read current levels for every slug.
  const slugs = Array.from(new Set(lines.map((l) => l.slug)));
  const { data: stockRows, error: stockErr } = await supabaseAdmin()
    .from("inventory")
    .select("slug, stock")
    .in("slug", slugs);
  if (stockErr) {
    return NextResponse.json({ error: stockErr.message }, { status: 500 });
  }
  const stockBySlug = new Map(
    (stockRows ?? []).map((r) => [r.slug as string, r.stock as number])
  );
  // Sum requested qty per slug (lines may repeat if same product appears multiple times)
  const requested = new Map<string, number>();
  for (const l of lines) {
    requested.set(l.slug, (requested.get(l.slug) ?? 0) + l.qty);
  }
  for (const [slug, qty] of requested) {
    if ((stockBySlug.get(slug) ?? 0) < qty) {
      const failed = products.find((p) => p.slug === slug);
      return NextResponse.json(
        {
          error: "Out of stock",
          slug,
          name: failed?.name ?? slug,
        },
        { status: 409 }
      );
    }
  }

  // 2b. Chain stock check — same idea, keyed by chain id ----------------------
  const chainQty = new Map<string, { qty: number; name: string }>();
  for (const l of lines) {
    if (!l.chainId) continue;
    const prev = chainQty.get(l.chainId);
    chainQty.set(l.chainId, {
      qty: (prev?.qty ?? 0) + l.qty,
      name: l.chainName ?? l.chainId,
    });
  }
  if (chainQty.size > 0) {
    const chainIds = Array.from(chainQty.keys());
    const { data: chainStockRows, error: chainStockErr } = await supabaseAdmin()
      .from("chain_options")
      .select("id, stock")
      .in("id", chainIds);
    if (chainStockErr) {
      return NextResponse.json({ error: chainStockErr.message }, { status: 500 });
    }
    const stockByChain = new Map(
      (chainStockRows ?? []).map((r) => [r.id as string, r.stock as number])
    );
    for (const [id, { qty, name }] of chainQty) {
      if ((stockByChain.get(id) ?? 0) < qty) {
        return NextResponse.json(
          {
            error: "Chain out of stock",
            slug: id,
            name: `${name} (chain)`,
          },
          { status: 409 }
        );
      }
    }
  }

  // 3. Total + shipping computed server-side from authoritative prices.
  const grossSubtotalPaise = lines.reduce(
    (sum, l) => sum + l.unitPaise * l.qty,
    0
  );

  // 3b. Apply abandoned-cart recovery code if provided. Re-validate
  // server-side — the client UI is just a hint. Discount is taken
  // off the SUBTOTAL only; shipping is computed on the discounted
  // subtotal so we don't accidentally cross the free-shipping line
  // because of the discount.
  let discountPercent = 0;
  let discountPaise = 0;
  let appliedCode: string | null = null;
  let appliedPromoCode = false;
  if (body.discountCode) {
    const code = body.discountCode.trim().toUpperCase();
    // 1. Try the merchant-issued promo_codes table first.
    const { data: promo } = await supabaseAdmin()
      .from("promo_codes")
      .select("code, flat_amount_off, percent_off, min_subtotal, max_uses, times_used, active")
      .eq("code", code)
      .maybeSingle();
    if (promo && promo.active) {
      const usable =
        promo.max_uses == null || promo.times_used < promo.max_uses;
      const meetsMin = promo.min_subtotal <= grossSubtotalPaise / 100;
      if (usable && meetsMin) {
        const flatPaise = (promo.flat_amount_off ?? 0) * 100;
        const percentPaise = Math.round(
          (grossSubtotalPaise * (promo.percent_off ?? 0)) / 100
        );
        discountPaise = Math.min(grossSubtotalPaise, flatPaise + percentPaise);
        discountPercent = promo.percent_off ?? 0;
        appliedCode = code;
        appliedPromoCode = true;
      }
    }
    // 2. Fall back to the per-cart abandoned-cart recovery codes.
    if (!appliedCode) {
      const { data: codeRow } = await supabaseAdmin()
        .from("pending_orders")
        .select("recovery_code, recovery_percent_off, recovered_at, completed_at")
        .eq("recovery_code", code)
        .is("completed_at", null)
        .maybeSingle();
      if (codeRow) {
        const recovered = codeRow.recovered_at
          ? new Date(codeRow.recovered_at).getTime()
          : null;
        const expired =
          recovered !== null && Date.now() > recovered + 7 * 24 * 3600 * 1000;
        if (!expired) {
          discountPercent = Math.max(
            0,
            Math.min(50, codeRow.recovery_percent_off ?? 10)
          );
          discountPaise = Math.round(
            (grossSubtotalPaise * discountPercent) / 100
          );
          appliedCode = code;
        }
      }
    }
  }

  // 3c. Apply the live BOGO offer when it's active. Server-side gate
  // checks the deadline so a stale client can't claim an expired deal.
  let bogoPaise = 0;
  if (offerActiveAt()) {
    bogoPaise = computeBogoDiscount(
      lines.map((l) => ({
        eligible: ACTIVE_OFFER.slugMatches.some((m) =>
          l.slug.toLowerCase().includes(m)
        ),
        unitPrice: l.unitPaise,
        qty: l.qty,
      }))
    );
  }

  const subtotalPaise = Math.max(0, grossSubtotalPaise - discountPaise - bogoPaise);
  const subtotalInr = subtotalPaise / 100;

  // Payment method: 'online' bills subtotal + shipping upfront.
  // 'cod' bills ONLY the flat COD fee upfront — no shipping — and
  // leaves the product subtotal to be collected in cash on delivery.
  // Pre-order items must be prepaid — silently force online when the
  // cart contains any pre-order product, even if the client asked for
  // COD. Prevents tampered clients from reserving launch stock without
  // paying up front.
  const hasPreOrder = lines.some((l) => {
    const p = products.find((pp) => pp.slug === l.slug);
    return !!p?.isPreOrder;
  });
  const paymentMethod: "online" | "cod" =
    body.paymentMethod === "cod" && !hasPreOrder ? "cod" : "online";
  const shippingPaise =
    paymentMethod === "cod"
      ? 0
      : computeShippingForCart(
          lines.map((l) => ({ category: l.category })),
          subtotalInr
        ) * 100;
  const codChargePaise = paymentMethod === "cod" ? COD_CHARGE * 100 : 0;
  const totalPaise = subtotalPaise + shippingPaise + codChargePaise;
  const amountPaise =
    paymentMethod === "cod" ? codChargePaise : totalPaise;

  // 4. Create the Razorpay order.
  const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });
  // receipt must be <= 40 chars
  const receipt = `mc_${Date.now().toString(36)}`;

  try {
    const order = await rzp.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt,
      notes: {
        customer_name: body.customer?.name?.slice(0, 100) ?? "",
        customer_phone: body.customer?.phone?.slice(0, 30) ?? "",
        customer_email: body.customer?.email?.slice(0, 100) ?? "",
        instagram: body.customer?.instagram?.slice(0, 50) ?? "",
        items: lines
          .map((l) => `${l.name} x${l.qty}`)
          .join(", ")
          .slice(0, 500),
      },
    });

    // Persist a pending-orders row so the cron can find this if the
    // customer abandons the Razorpay modal. The verify endpoint marks
    // it completed_at when payment succeeds. If a recovery code was
    // applied, denormalize it onto this row so verify can also mark
    // the ORIGINAL recovery row as completed (prevents code reuse).
    // Errors here don't block checkout — recovery is nice-to-have.
    try {
      await supabaseAdmin()
        .from("pending_orders")
        .upsert(
          {
            razorpay_order_id: order.id,
            customer_name: body.customer?.name ?? "",
            customer_email: body.customer?.email ?? "",
            customer_phone: body.customer?.phone ?? "",
            customer_instagram: body.customer?.instagram ?? "",
            items: lines.map((l) => ({
              slug: l.slug,
              name: l.name,
              qty: l.qty,
              chainName: l.chainName,
              unitPrice: Math.round(l.unitPaise / 100),
            })),
            subtotal: Math.round(subtotalPaise / 100),
            shipping: Math.round(shippingPaise / 100),
            total: Math.round(totalPaise / 100),
            recovery_code: appliedCode,
            recovery_percent_off: appliedCode ? discountPercent : 10,
          },
          { onConflict: "razorpay_order_id" }
        );
    } catch (e) {
      console.error("[pending-orders] upsert failed", e);
    }

    return NextResponse.json({
      razorpayOrderId: order.id,
      amountPaise,
      totalPaise,
      codChargePaise,
      paymentMethod,
      currency: "INR",
      keyId,
      appliedCode,
      appliedPromoCode,
      discountPercent,
      discountPaise,
    });
  } catch (e: unknown) {
    const message =
      e && typeof e === "object" && "error" in e
        ? JSON.stringify((e as { error: unknown }).error)
        : e instanceof Error
          ? e.message
          : "Razorpay order creation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
