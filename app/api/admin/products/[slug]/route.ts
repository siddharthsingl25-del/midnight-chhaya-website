/**
 * Admin product item routes.
 *
 *   PUT    /api/admin/products/[slug]   → update existing product
 *   DELETE /api/admin/products/[slug]   → remove
 */

import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { isAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabase";

type Params = { params: Promise<{ slug: string }> };

async function guard() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  return null;
}

export async function PUT(req: Request, { params }: Params) {
  const block = await guard();
  if (block) return block;
  const { slug } = await params;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (typeof body.name === "string") patch.name = body.name.trim();
  if (
    typeof body.category === "string" &&
    ["rings", "chains", "keychains", "bracelets", "earbuds"].includes(body.category)
  ) {
    patch.category = body.category;
  }
  if (body.price === null) patch.price = null;
  else if (body.price !== undefined) {
    const n = Number(body.price);
    if (!Number.isFinite(n) || n < 0) {
      return NextResponse.json({ error: "Bad price" }, { status: 400 });
    }
    patch.price = n;
  }
  if (body.cost_price === null || body.cost_price === "") patch.cost_price = null;
  else if (body.cost_price !== undefined) {
    const n = Number(body.cost_price);
    if (!Number.isFinite(n) || n < 0) {
      return NextResponse.json({ error: "Bad cost price" }, { status: 400 });
    }
    patch.cost_price = n;
  }
  if (typeof body.short_description === "string")
    patch.short_description = body.short_description;
  if (typeof body.description === "string") patch.description = body.description;
  if (Array.isArray(body.materials)) patch.materials = body.materials.map(String);
  if (body.dimensions === null) patch.dimensions = null;
  else if (typeof body.dimensions === "string") patch.dimensions = body.dimensions;
  if (Array.isArray(body.images)) patch.images = body.images.map(String);
  if (typeof body.exclusive === "boolean") patch.exclusive = body.exclusive;
  if (typeof body.featured === "boolean") patch.featured = body.featured;
  if (typeof body.for_women === "boolean") patch.for_women = body.for_women;
  if (body.variant_kind === null || body.variant_kind === "") patch.variant_kind = null;
  else if (body.variant_kind === "chain" || body.variant_kind === "car") {
    patch.variant_kind = body.variant_kind;
  }
  if (body.badge_text === null || body.badge_text === "") patch.badge_text = null;
  else if (typeof body.badge_text === "string") patch.badge_text = body.badge_text.trim().slice(0, 40) || null;
  if (body.badge_image === null || body.badge_image === "") patch.badge_image = null;
  else if (typeof body.badge_image === "string") patch.badge_image = body.badge_image.trim() || null;
  if (Array.isArray(body.related_slugs)) {
    patch.related_slugs = (body.related_slugs as unknown[])
      .filter((s): s is string => typeof s === "string" && !!s.trim())
      .map((s) => s.trim())
      .slice(0, 12);
  }
  if (typeof body.is_pre_order === "boolean") patch.is_pre_order = body.is_pre_order;
  if (body.launch_price === null || body.launch_price === "") patch.launch_price = null;
  else if (body.launch_price !== undefined) {
    const n = Number(body.launch_price);
    if (!Number.isFinite(n) || n < 0) {
      return NextResponse.json({ error: "Bad launch price" }, { status: 400 });
    }
    patch.launch_price = n;
  }
  if (typeof body.display_order === "number" && Number.isFinite(body.display_order)) {
    patch.display_order = Math.floor(body.display_order);
  }

  const { data, error } = await supabaseAdmin()
    .from("products")
    .update(patch)
    .eq("slug", slug)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidateTag("products", "max");
  return NextResponse.json({ row: data });
}

export async function DELETE(_req: Request, { params }: Params) {
  const block = await guard();
  if (block) return block;
  const { slug } = await params;

  const sb = supabaseAdmin();
  const { error } = await sb.from("products").delete().eq("slug", slug);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Also remove the inventory row.
  await sb.from("inventory").delete().eq("slug", slug);

  revalidateTag("products", "max");
  return NextResponse.json({ ok: true });
}
