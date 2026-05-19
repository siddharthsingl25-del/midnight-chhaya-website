"use client";

/**
 * Live stock provider.
 *
 * Fetches the full inventory from Supabase once on mount, then exposes
 * `useStock(slug)` so any product card / detail can show its current
 * count. After a successful checkout, components can call `refresh()`
 * to re-pull the latest numbers.
 *
 * Failure mode: if Supabase isn't configured (no env vars yet), the hook
 * returns `null` and components fall back to "stock unknown" — they never
 * crash and the rest of the site still works.
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
import { supabaseBrowser } from "@/lib/supabase";

type StockMap = Record<string, number>;

type Ctx = {
  /** Map of slug → current stock. Empty until first load completes. */
  stock: StockMap;
  /** true once at least one fetch has completed. */
  ready: boolean;
  /** Re-fetch from Supabase. Call after checkout. */
  refresh: () => Promise<void>;
};

const StockCtx = createContext<Ctx | null>(null);

export function StockProvider({ children }: { children: ReactNode }) {
  const [stock, setStock] = useState<StockMap>({});
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const sb = supabaseBrowser();
    if (!sb) {
      // Env vars not set — leave map empty, mark ready so consumers proceed.
      setReady(true);
      return;
    }
    const { data, error } = await sb.from("inventory").select("slug, stock");
    if (!error && data) {
      const next: StockMap = {};
      for (const row of data as { slug: string; stock: number }[]) {
        next[row.slug] = row.stock;
      }
      setStock(next);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<Ctx>(
    () => ({ stock, ready, refresh }),
    [stock, ready, refresh]
  );

  return <StockCtx.Provider value={value}>{children}</StockCtx.Provider>;
}

/** Stock for a given product slug.
 *  - returns `number` when known
 *  - returns `null` while the first fetch is in flight (or when Supabase is
 *    unconfigured) — components should treat null as "unknown" and not
 *    block the customer. */
export function useStock(slug: string): number | null {
  const ctx = useContext(StockCtx);
  if (!ctx || !ctx.ready) return null;
  return ctx.stock[slug] ?? null;
}

/** Used by checkout to refresh stock after a successful order. */
export function useStockRefresh(): () => Promise<void> {
  const ctx = useContext(StockCtx);
  return ctx?.refresh ?? (async () => {});
}
