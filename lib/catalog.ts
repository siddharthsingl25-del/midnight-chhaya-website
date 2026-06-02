/**
 * Server-side catalog data helpers.
 *
 * All public site reads go through these — no component imports static
 * arrays anymore. Uses the anon (publishable) client because the
 * products / chain_options tables are public-read via RLS.
 *
 * Cached via Next's `unstable_cache` so repeated reads in a single
 * render are free. Cache tags let the admin API revalidate on mutation:
 *   revalidateTag('products')  → next read refetches
 *   revalidateTag('chains')    → ditto
 */

import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import {
  productFromRow,
  chainFromRow,
  type Product,
  type ChainOption,
} from "./types";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

function sb() {
  if (!URL || !KEY) return null;
  return createClient(URL, KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/* ───── Products ──────────────────────────────────────────────────────── */

export const getAllProducts = unstable_cache(
  async (): Promise<Product[]> => {
    const client = sb();
    if (!client) return [];
    const { data, error } = await client
      .from("products")
      .select("*")
      .order("display_order", { ascending: true });
    if (error || !data) return [];
    return data.map(productFromRow);
  },
  ["all-products"],
  { tags: ["products"], revalidate: 60 }
);

export async function getProductsByCategory(
  cat: Product["category"] | "all"
): Promise<Product[]> {
  const all = await getAllProducts();
  if (cat === "all") return all;
  return all.filter((p) => p.category === cat);
}

export async function getProduct(slug: string): Promise<Product | null> {
  const all = await getAllProducts();
  return all.find((p) => p.slug === slug) ?? null;
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const all = await getAllProducts();
  return all.filter((p) => p.featured);
}

export async function getRelatedProducts(
  slug: string,
  category: Product["category"],
  limit = 3
): Promise<Product[]> {
  const all = await getAllProducts();
  const self = all.find((p) => p.slug === slug);
  // Manual override first: if the merchant has set related_slugs on
  // this product, render exactly those in their chosen order.
  if (self && self.relatedSlugs.length > 0) {
    const bySlug = new Map(all.map((p) => [p.slug, p]));
    return self.relatedSlugs
      .map((s) => bySlug.get(s))
      .filter((p): p is Product => Boolean(p) && p!.slug !== slug)
      .slice(0, limit);
  }
  // Fallback: category siblings.
  return all
    .filter((p) => p.slug !== slug && p.category === category)
    .slice(0, limit);
}

/* ───── Chains ────────────────────────────────────────────────────────── */

export const getAllChains = unstable_cache(
  async (): Promise<ChainOption[]> => {
    const client = sb();
    if (!client) return [];
    const { data, error } = await client
      .from("chain_options")
      .select("*")
      .order("display_order", { ascending: true });
    if (error || !data) return [];
    return data.map(chainFromRow);
  },
  ["all-chains"],
  { tags: ["chains"], revalidate: 60 }
);

export async function getChain(id: string): Promise<ChainOption | null> {
  const all = await getAllChains();
  return all.find((c) => c.id === id) ?? null;
}
