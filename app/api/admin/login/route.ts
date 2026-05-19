/**
 * POST /api/admin/login
 * Body: { password: string }
 * Sets the admin cookie if the password matches ADMIN_PASSWORD env var.
 */

import { NextResponse } from "next/server";
import { setAdminCookie, verifyPassword } from "@/lib/adminAuth";

export async function POST(req: Request) {
  const { password } = (await req.json().catch(() => ({}))) as {
    password?: string;
  };
  if (typeof password !== "string" || !verifyPassword(password)) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }
  await setAdminCookie();
  return NextResponse.json({ ok: true });
}
