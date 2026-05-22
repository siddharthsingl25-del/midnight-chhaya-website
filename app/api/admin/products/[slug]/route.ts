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
    ["rings", "chains", "keychains", "bracelets", "women"].includes(body.category)
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
  if (typeof body.short_description === "string")
    patch.short_description = body.short_description;
  if (typeof body.description === "string") patch.description = body.description;
  if (Array.isArray(body.materials)) patch.materials = body.materials.map(String);
  if (body.dimensions === null) patch.dimensions = null;
  else if (typeof body.dimensions === "string") patch.dimensions = body.dimensions;
  if (Array.isArray(body.images)) patch.images = body.images.map(String);
  if (typeof body.exclusive === "boolean") patch.exclusive = body.exclusive;
  if (typeof body.featured === "boolean") patch.featured = body.featured;

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
