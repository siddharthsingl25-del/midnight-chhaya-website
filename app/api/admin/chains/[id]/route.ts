import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { isAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabase";

type Params = { params: Promise<{ id: string }> };

async function guard() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  return null;
}

export async function PUT(req: Request, { params }: Params) {
  const block = await guard();
  if (block) return block;
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (typeof body.name === "string") patch.name = body.name.trim();
  if (typeof body.image === "string") patch.image = body.image;
  if (body.price_modifier !== undefined) {
    const n = Number(body.price_modifier);
    if (!Number.isFinite(n) || n < 0) {
      return NextResponse.json({ error: "Bad price modifier" }, { status: 400 });
    }
    patch.price_modifier = n;
  }
  if (body.cost_price === null || body.cost_price === "") patch.cost_price = null;
  else if (body.cost_price !== undefined) {
    const n = Number(body.cost_price);
    if (!Number.isFinite(n) || n < 0) {
      return NextResponse.json({ error: "Bad cost price" }, { status: 400 });
    }
    patch.cost_price = n;
  }
  if (body.stock !== undefined) {
    const n = Number(body.stock);
    if (!Number.isFinite(n) || n < 0) {
      return NextResponse.json({ error: "Bad stock" }, { status: 400 });
    }
    patch.stock = Math.floor(n);
  }

  const { data, error } = await supabaseAdmin()
    .from("chain_options")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidateTag("chains", "max");
  return NextResponse.json({ row: data });
}

export async function DELETE(_req: Request, { params }: Params) {
  const block = await guard();
  if (block) return block;
  const { id } = await params;
  const { error } = await supabaseAdmin()
    .from("chain_options")
    .delete()
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidateTag("chains", "max");
  return NextResponse.json({ ok: true });
}
