/**
 * Supabase clients.
 *
 *  - `supabaseAdmin()` — server-only. Uses the SECRET key, bypasses RLS.
 *    Use in API route handlers for stock writes, atomic order placement,
 *    and admin operations. NEVER imported from a client component.
 *
 *  - `supabaseBrowser()` — anon, read-only (write attempts are blocked by RLS).
 *    Use from client components to fetch live stock counts.
 *
 * Required environment variables (see .env.example):
 *   NEXT_PUBLIC_SUPABASE_URL              project URL
 *   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY  anon/publishable key (safe to ship)
 *   SUPABASE_SECRET_KEY                   service-role secret key (server only)
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

let _admin: SupabaseClient | null = null;
let _browser: SupabaseClient | null = null;

/** Server-side admin client — only for API route handlers. */
export function supabaseAdmin(): SupabaseClient {
  if (_admin) return _admin;
  const SECRET_KEY = process.env.SUPABASE_SECRET_KEY ?? "";
  if (!URL || !SECRET_KEY) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY env var"
    );
  }
  _admin = createClient(URL, SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _admin;
}

/** Client-side reader. Safe to call from browser. Returns null when env
 * vars aren't configured yet, so callers can fall back gracefully. */
export function supabaseBrowser(): SupabaseClient | null {
  if (_browser) return _browser;
  if (!URL || !PUBLISHABLE_KEY) return null;
  _browser = createClient(URL, PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _browser;
}

export type InventoryRow = {
  slug: string;
  stock: number;
  updated_at: string;
};
