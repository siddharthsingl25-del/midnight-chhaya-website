/**
 * Idempotent seed runner.
 *
 * Auto-syncs data/seed-products.ts into the Supabase products + inventory
 * tables on cold start. Designed to be safe to call on every request —
 * an in-memory flag guarantees it only runs once per server instance,
 * and the inserts use `ignoreDuplicates: true` so they never overwrite
 * the merchant's own /admin edits.
 *
 * Call once from app/layout.tsx (server component) before fetching the
 * catalog, so any newly-deployed seed product is in the DB by the time
 * the public site renders.
 */

import { revalidateTag } from "next/cache";
import { SEED_PRODUCTS } from "@/data/seed-products";
import { supabaseAdmin } from "./supabase";

let synced = false;
let inFlight: Promise<void> | null = null;

export async function syncSeedProducts(): Promise<void> {
  if (synced) return;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      // supabaseAdmin throws if env vars aren't configured — common during
      // local dev without a Supabase project. Treat that as "skip sync".
      let sb;
      try {
        sb = supabaseAdmin();
      } catch {
        return;
      }

      // One batched upsert for products. ignoreDuplicates means existing
      // rows are left alone — merchant's admin edits stay intact.
      const { error: productErr } = await sb
        .from("products")
        .upsert(SEED_PRODUCTS, {
          onConflict: "slug",
          ignoreDuplicates: true,
        });
      if (productErr) {
        console.error("[seed] products upsert failed:", productErr.message);
        return;
      }

      // Seed inventory at 0 for any new product, leave existing rows alone.
      const inventoryRows = SEED_PRODUCTS.map((p) => ({
        slug: p.slug,
        stock: 0,
      }));
      const { error: invErr } = await sb
        .from("inventory")
        .upsert(inventoryRows, {
          onConflict: "slug",
          ignoreDuplicates: true,
        });
      if (invErr) {
        console.error("[seed] inventory upsert failed:", invErr.message);
        return;
      }

      // Bust the products cache so the new rows show up immediately rather
      // than after the 60-second stale window in lib/catalog.ts.
      try {
        revalidateTag("products", "max");
      } catch {
        /* outside a render context — fine */
      }

      synced = true;
      console.log(`[seed] synced ${SEED_PRODUCTS.length} products`);
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}
