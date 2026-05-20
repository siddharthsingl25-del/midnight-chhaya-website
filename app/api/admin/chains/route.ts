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
    .from("chain_options")
    .select("*")
    .order("display_order", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rows: data ?? [] });
}

export async function POST(req: Request) {
  const block = await guard();
  if (block) return block;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const { id, name, image, price_modifier = 0 } = body;

  if (typeof id !== "string" || !id.trim()) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Missing name" }, { status: 400 });
  }
  if (typeof image !== "string" || !image) {
    return NextResponse.json({ error: "Missing image" }, { status: 400 });
  }

  const { data: lastRow } = await supabaseAdmin()
    .from("chain_options")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const display_order = (lastRow?.display_order ?? -1) + 1;

  const row = {
    id: id.trim(),
    name: name.trim(),
    image,
    price_modifier: Number(price_modifier) || 0,
    display_order,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin()
    .from("chain_options")
    .insert(row)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidateTag("chains", "max");
  return NextResponse.json({ row: data });
}
