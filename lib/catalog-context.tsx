"use client";

/**
 * Client-side catalog state.
 *
 * Server-rendered pages pass their fetched products + chains down as
 * `initialProducts` / `initialChains` so the first render has the right
 * data (no flash of empty cart, etc.). After mount, we silently re-pull
 * via the anon Supabase client so cart panels, chain pickers, and
 * product cards always see the freshest catalog if the merchant added
 * something from /admin while the page was open.
 *
 * Two hooks:
 *   useProducts()        – array of all products
 *   useChains()          – array of all chain options
 *
 * Plus a couple of convenience lookups for cart resolution.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@supabase/supabase-js";
import {
  chainFromRow,
  productFromRow,
  type ChainOption,
  type Product,
} from "./types";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

function browserClient() {
  if (!URL || !KEY) return null;
  return createClient(URL, KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

type Ctx = {
  products: Product[];
  chains: ChainOption[];
  /** Refresh both arrays from Supabase. */
  refresh: () => Promise<void>;
};

const CatalogCtx = createContext<Ctx | null>(null);

export function CatalogProvider({
  initialProducts = [],
  initialChains = [],
  children,
}: {
  initialProducts?: Product[];
  initialChains?: ChainOption[];
  children: ReactNode;
}) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [chains, setChains] = useState<ChainOption[]>(initialChains);

  const refresh = useCallback(async () => {
    const sb = browserClient();
    if (!sb) return;
    const [{ data: prodRows }, { data: chainRows }] = await Promise.all([
      sb.from("products").select("*").order("display_order"),
      sb.from("chain_options").select("*").order("display_order"),
    ]);
    if (prodRows) setProducts(prodRows.map(productFromRow));
    if (chainRows) setChains(chainRows.map(chainFromRow));
  }, []);

  useEffect(() => {
    /* If the SSR pass didn't have data (e.g. env vars only on the
     * client, very first load before warming), fetch immediately.
     * Otherwise refresh lazily so any admin edits made after this
     * page loaded show up without a hard reload. */
    if (initialProducts.length === 0 && initialChains.length === 0) {
      void refresh();
    } else {
      const t = setTimeout(refresh, 1500);
      return () => clearTimeout(t);
    }
  }, [refresh, initialProducts.length, initialChains.length]);

  const value = useMemo<Ctx>(
    () => ({ products, chains, refresh }),
    [products, chains, refresh]
  );

  return <CatalogCtx.Provider value={value}>{children}</CatalogCtx.Provider>;
}

function useCatalog(): Ctx {
  const ctx = useContext(CatalogCtx);
  if (!ctx) throw new Error("useCatalog must be used inside <CatalogProvider>");
  return ctx;
}

export function useProducts(): Product[] {
  return useCatalog().products;
}

export function useChains(): ChainOption[] {
  return useCatalog().chains;
}

export function useProductBySlug(slug: string): Product | undefined {
  const products = useProducts();
  return products.find((p) => p.slug === slug);
}

export function useChainById(id?: string | null): ChainOption | undefined {
  const chains = useChains();
  return id ? chains.find((c) => c.id === id) : undefined;
}

export function useCatalogRefresh(): () => Promise<void> {
  return useCatalog().refresh;
}
