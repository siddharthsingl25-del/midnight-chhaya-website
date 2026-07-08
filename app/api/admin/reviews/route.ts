/**
 * Admin reviews collection routes.
 *
 *   GET  /api/admin/reviews   → list all (newest first)
 *   POST /api/admin/reviews   → create; body: { image_url }
 *
 * Both require the admin cookie.
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
    .from("reviews")
    .select("*")
    .order("display_order", { ascending: true })
    .order("id", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rows: data ?? [] });
}

export async function POST(req: Request) {
  const block = await guard();
  if (block) return block;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const imageUrl = typeof body.image_url === "string" ? body.image_url.trim() : "";
  if (!imageUrl) {
    return NextResponse.json({ error: "Image is required" }, { status: 400 });
  }

  const { data: last } = await supabaseAdmin()
    .from("reviews")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const displayOrder = (last?.display_order ?? -1) + 10;

  const { data, error } = await supabaseAdmin()
    .from("reviews")
    .insert({ image_url: imageUrl, display_order: displayOrder })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidateTag("reviews", "max");
  return NextResponse.json({ row: data });
}
