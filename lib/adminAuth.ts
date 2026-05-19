/**
 * Tiny admin auth — single password, signed cookie.
 *
 * No real user accounts. Posting the correct ADMIN_PASSWORD sets an
 * httpOnly cookie containing a SHA-256 of the password. API routes
 * verify the cookie before any privileged action. The password itself
 * never reaches the browser.
 *
 * If the env var is missing, every admin request is rejected.
 */

import { createHash } from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "mc_admin";
/** 30 days */
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function passwordHash(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return null;
  return createHash("sha256").update(pw).digest("hex");
}

/** Returns true if the provided password matches the env var. */
export function verifyPassword(provided: string): boolean {
  const expected = passwordHash();
  if (!expected) return false;
  const got = createHash("sha256").update(provided).digest("hex");
  // length-safe compare — strings same length, regular === is fine here
  return got === expected;
}

/** Set the admin cookie on a successful login. Call from a route handler. */
export async function setAdminCookie(): Promise<void> {
  const expected = passwordHash();
  if (!expected) throw new Error("ADMIN_PASSWORD env var is not set");
  const jar = await cookies();
  jar.set(COOKIE_NAME, expected, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

/** Clears the cookie (logout). */
export async function clearAdminCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

/** Verify the request is from a logged-in admin. */
export async function isAdmin(): Promise<boolean> {
  const expected = passwordHash();
  if (!expected) return false;
  const jar = await cookies();
  const got = jar.get(COOKIE_NAME)?.value;
  return got === expected;
}
