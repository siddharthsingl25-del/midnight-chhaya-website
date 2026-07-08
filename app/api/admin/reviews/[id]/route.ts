/**
 * DELETE /api/admin/reviews/[id] — remove a review row.
 */

import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { isAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabase";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { id } = await params;
  const idNum = Number(id);
  if (!Number.isFinite(idNum) || idNum <= 0) {
    return NextResponse.json({ error: "Bad id" }, { status: 400 });
  }
  const { error } = await supabaseAdmin()
    .from("reviews")
    .delete()
    .eq("id", idNum);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidateTag("reviews", "max");
  return NextResponse.json({ ok: true });
}
