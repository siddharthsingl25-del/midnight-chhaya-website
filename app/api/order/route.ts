/**
 * POST /api/order
 *
 * Body: { items: { slug: string; qty: number; chainId?: string }[],
 *         customer: { name, instagram, phone, email, address1, address2,
 *                     city, state, pin, notes },
 *         orderText: string,
 *         titleSummary: string }
 *
 * Flow:
 *   1. Decrement stock atomically for each item via the decrement_stock RPC.
 *      If any item is out of stock, ALL prior decrements are rolled back
 *      manually (best-effort) and the route returns 409 with the slug that
 *      failed so the customer can be told.
 *   2. Send the ntfy push notification with the order details.
 *
 * Server-only — uses the secret Supabase key (never reaches the browser).
 */

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { SITE } from "@/lib/site";

type Item = { slug: string; qty: number };
type Body = {
  items: Item[];
  orderText: string;
  titleSummary: string;
};

export async function POST(req: Request) {
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

  // 1. Decrement stock for every line. Track successes so we can roll back.
  const sb = supabaseAdmin();
  const applied: { slug: string; qty: number }[] = [];

  for (const { slug, qty } of items) {
    if (typeof slug !== "string" || typeof qty !== "number" || qty <= 0) {
      await rollback(applied);
      return NextResponse.json(
        { error: "Bad item", slug },
        { status: 400 }
      );
    }
    const { error } = await sb.rpc("decrement_stock", {
      p_slug: slug,
      p_qty: qty,
    });
    if (error) {
      await rollback(applied);
      return NextResponse.json(
        {
          error: "Out of stock",
          slug,
          detail: error.message,
        },
        { status: 409 }
      );
    }
    applied.push({ slug, qty });
  }

  // 2. Fire the merchant push notification. Don't fail the order if this hiccups.
  try {
    const asciiTitle =
      (body.titleSummary || "New order").replace(/[^\x20-\x7E]/g, "") ||
      "New order";
    await fetch(`https://ntfy.sh/${SITE.notifyTopic}`, {
      method: "POST",
      headers: {
        Title: asciiTitle,
        Priority: "high",
        Tags: "shopping_bags,sparkles",
      },
      body: body.orderText ?? "(no order text)",
    });
  } catch {
    /* swallowed — order is already booked, notification is best-effort */
  }

  return NextResponse.json({ ok: true });
}

/** Rolls back applied decrements by adding the qty back. Best-effort. */
async function rollback(applied: { slug: string; qty: number }[]) {
  if (applied.length === 0) return;
  const sb = supabaseAdmin();
  for (const { slug, qty } of applied) {
    // Read current, then upsert. Failure here is logged but ignored — we
    // never want a rollback failure to cascade into another user-visible error.
    const { data } = await sb
      .from("inventory")
      .select("stock")
      .eq("slug", slug)
      .maybeSingle();
    const next = (data?.stock ?? 0) + qty;
    await sb
      .from("inventory")
      .upsert({ slug, stock: next, updated_at: new Date().toISOString() });
  }
}
