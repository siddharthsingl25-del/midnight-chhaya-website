/**
 * Admin product collection routes.
 *
 *   GET  /api/admin/products              → list all (with full fields)
 *   POST /api/admin/products              → create new
 *
 * Both require the admin cookie.
 * On any write, the products cache tag is revalidated so the public
 * site picks up the change on the next render.
 */

import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { isAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabase";

async function guard() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  return null;
}

export async function GET() {
  const block = await guard();
  if (block) return block;

  const { data, error } = await supabaseAdmin()
    .from("products")
    .select("*")
    .order("display_order", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rows: data ?? [] });
}

export async function POST(req: Request) {
  const block = await guard();
  if (block) return block;

  const body = await req.json().catch(() => ({}));
  const {
    slug,
    name,
    category,
    price,
    short_description = "",
    description = "",
    materials = [],
    dimensions = null,
    images = [],
    exclusive = false,
    featured = false,
    for_women = false,
    variant_kind = null,
    badge_text = null,
    badge_image = null,
  } = body as Record<string, unknown>;

  if (typeof slug !== "string" || !slug.trim()) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }
  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Missing name" }, { status: 400 });
  }
  if (
    typeof category !== "string" ||
    !["rings", "chains", "keychains", "bracelets"].includes(category)
  ) {
    return NextResponse.json({ error: "Bad category" }, { status: 400 });
  }
  const priceVal =
    price === null || price === undefined || price === "" ? null : Number(price);
  if (priceVal !== null && (!Number.isFinite(priceVal) || priceVal < 0)) {
    return NextResponse.json({ error: "Bad price" }, { status: 400 });
  }

  // Next display_order = max + 1
  const { data: lastRow } = await supabaseAdmin()
    .from("products")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const display_order = (lastRow?.display_order ?? -1) + 1;

  const row = {
    slug: slug.trim(),
    name: name.trim(),
    category,
    price: priceVal,
    short_description: String(short_description),
    description: String(description),
    materials: Array.isArray(materials) ? materials.map(String) : [],
    dimensions: dimensions ? String(dimensions) : null,
    images: Array.isArray(images) ? images.map(String) : [],
    exclusive: Boolean(exclusive),
    featured: Boolean(featured),
    for_women: Boolean(for_women),
    variant_kind:
      variant_kind === "chain" || variant_kind === "car" ? variant_kind : null,
    badge_text: typeof badge_text === "string" && badge_text.trim() ? badge_text.trim().slice(0, 40) : null,
    badge_image: typeof badge_image === "string" && badge_image.trim() ? badge_image.trim() : null,
    display_order,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin()
    .from("products")
    .insert(row)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Also seed an inventory row at 0 so stock controls work immediately
  await supabaseAdmin()
    .from("inventory")
    .upsert({ slug: row.slug, stock: 0, updated_at: row.updated_at });

  revalidateTag("products", "max");
  return NextResponse.json({ row: data });
}
