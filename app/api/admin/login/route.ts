/**
 * POST /api/admin/login
 * Body: { password: string }
 * Sets the admin cookie if the password matches ADMIN_PASSWORD env var.
 *
 * Rate limiting:
 *   - Every failed attempt sleeps 1500ms before responding, so a
 *     brute-force script gets ~40 tries/minute per connection instead
 *     of thousands per second.
 *   - Serverless-safe (no shared state needed) — Vercel just holds the
 *     function open for the extra 1.5s per bad try.
 *   - Combined with a strong 16+ character ADMIN_PASSWORD, brute-force
 *     is effectively impossible (would take centuries).
 */

import { NextResponse } from "next/server";
import { setAdminCookie, verifyPassword } from "@/lib/adminAuth";

const FAILED_ATTEMPT_DELAY_MS = 1500;

export async function POST(req: Request) {
  const { password } = (await req.json().catch(() => ({}))) as {
    password?: string;
  };
  if (typeof password !== "string" || !verifyPassword(password)) {
    await new Promise((r) => setTimeout(r, FAILED_ATTEMPT_DELAY_MS));
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }
  await setAdminCookie();
  return NextResponse.json({ ok: true });
}
