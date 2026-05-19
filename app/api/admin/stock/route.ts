/**
 * Admin stock API.
 *
 *   GET  /api/admin/stock                  → list all rows (slug, stock, updated_at)
 *   PUT  /api/admin/stock { slug, stock }  → set absolute stock count
 *   PATCH /api/admin/stock { slug, delta } → bump stock by a delta (+/-)
 *
 * All require the admin cookie set by /api/admin/login.
 */

import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/adminAuth";
import { supabaseAdmin, type InventoryRow } from "@/lib/supabase";

async function requireAdmin() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  return null;
}

export async function GET() {
  const guard = await requireAdmin();
  if (guard) return guard;

  const { data, error } = await supabaseAdmin()
    .from("inventory")
    .select("slug, stock, updated_at")
    .order("slug");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rows: (data ?? []) as InventoryRow[] });
}

export async function PUT(req: Request) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const body = (await req.json().catch(() => ({}))) as {
    slug?: string;
    stock?: number;
  };
  if (typeof body.slug !== "string" || typeof body.stock !== "number") {
    return NextResponse.json({ error: "Missing slug or stock" }, { status: 400 });
  }
  const stock = Math.max(0, Math.floor(body.stock));

  const { data, error } = await supabaseAdmin()
    .from("inventory")
    .upsert({ slug: body.slug, stock, updated_at: new Date().toISOString() })
    .select("slug, stock, updated_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ row: data });
}

export async function PATCH(req: Request) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const body = (await req.json().catch(() => ({}))) as {
    slug?: string;
    delta?: number;
  };
  if (typeof body.slug !== "string" || typeof body.delta !== "number") {
    return NextResponse.json({ error: "Missing slug or delta" }, { status: 400 });
  }

  // Read current, compute new, upsert. Two trips — fine for admin UI volume.
  const { data: current, error: readErr } = await supabaseAdmin()
    .from("inventory")
    .select("stock")
    .eq("slug", body.slug)
    .maybeSingle();
  if (readErr) return NextResponse.json({ error: readErr.message }, { status: 500 });

  const nextStock = Math.max(0, (current?.stock ?? 0) + body.delta);
  const { data, error } = await supabaseAdmin()
    .from("inventory")
    .upsert({ slug: body.slug, stock: nextStock, updated_at: new Date().toISOString() })
    .select("slug, stock, updated_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ row: data });
}
