/**
 * Admin expenses collection routes.
 *
 *   GET  /api/admin/expenses          → list recent (newest first)
 *   POST /api/admin/expenses          → create one
 *
 * Expenses are non-order costs (ads, collab payments, restock, etc).
 * They flow into the finance dashboard alongside per-order COGS to
 * compute net profit.
 */

import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabase";
import { EXPENSE_CATEGORIES, type ExpenseCategory } from "@/lib/types";

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
    .from("expenses")
    .select("*")
    .order("occurred_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(500);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rows: data ?? [] });
}

export async function POST(req: Request) {
  const block = await guard();
  if (block) return block;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const category = String(body.category ?? "");
  if (!EXPENSE_CATEGORIES.includes(category as ExpenseCategory)) {
    return NextResponse.json({ error: "Bad category" }, { status: 400 });
  }
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount < 0) {
    return NextResponse.json({ error: "Bad amount" }, { status: 400 });
  }
  const description =
    typeof body.description === "string" ? body.description.trim().slice(0, 280) : "";
  const occurredAt =
    typeof body.occurred_at === "string" && body.occurred_at.trim()
      ? body.occurred_at.trim()
      : new Date().toISOString().slice(0, 10);

  const { data, error } = await supabaseAdmin()
    .from("expenses")
    .insert({
      category,
      amount: Math.round(amount),
      description,
      occurred_at: occurredAt,
    })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ row: data });
}
