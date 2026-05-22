/**
 * Admin chain stock API.
 *
 *   GET   /api/admin/chain-stock                  → list every chain with stock
 *   PUT   /api/admin/chain-stock { id, stock }    → set absolute count
 *   PATCH /api/admin/chain-stock { id, delta }    → bump count by a delta (+/-)
 *
 * Mirrors /api/admin/stock but keyed by chain id instead of product slug.
 * All require the admin cookie set by /api/admin/login.
 */

import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabase";

type ChainStockRow = {
  id: string;
  name: string;
  image: string;
  stock: number;
  updated_at: string;
};

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
    .from("chain_options")
    .select("id, name, image, stock, updated_at")
    .order("display_order", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rows: (data ?? []) as ChainStockRow[] });
}

export async function PUT(req: Request) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const body = (await req.json().catch(() => ({}))) as {
    id?: string;
    stock?: number;
  };
  if (typeof body.id !== "string" || typeof body.stock !== "number") {
    return NextResponse.json({ error: "Missing id or stock" }, { status: 400 });
  }
  const stock = Math.max(0, Math.floor(body.stock));

  const { data, error } = await supabaseAdmin()
    .from("chain_options")
    .update({ stock, updated_at: new Date().toISOString() })
    .eq("id", body.id)
    .select("id, name, image, stock, updated_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ row: data });
}

export async function PATCH(req: Request) {
  const guard = await requireAdmin();
  if (guard) return guard;

  const body = (await req.json().catch(() => ({}))) as {
    id?: string;
    delta?: number;
  };
  if (typeof body.id !== "string" || typeof body.delta !== "number") {
    return NextResponse.json({ error: "Missing id or delta" }, { status: 400 });
  }

  const { data: current, error: readErr } = await supabaseAdmin()
    .from("chain_options")
    .select("stock")
    .eq("id", body.id)
    .maybeSingle();
  if (readErr) return NextResponse.json({ error: readErr.message }, { status: 500 });

  const nextStock = Math.max(0, (current?.stock ?? 0) + body.delta);
  const { data, error } = await supabaseAdmin()
    .from("chain_options")
    .update({ stock: nextStock, updated_at: new Date().toISOString() })
    .eq("id", body.id)
    .select("id, name, image, stock, updated_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ row: data });
}
