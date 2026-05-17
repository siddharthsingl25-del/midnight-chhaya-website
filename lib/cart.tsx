"use client";

/**
 * Cart — client-only context + hook with localStorage persistence.
 *
 * The site has no payment gateway yet, so "checkout" still routes to
 * Instagram for inquiry. The cart stores `(slug, qty)` lines; product
 * details (name, price, image) are looked up from PRODUCTS at render
 * time so prices stay in sync if the catalog is edited.
 *
 * To wire to real checkout later: replace the inquiry CTA in CartButton
 * with a call to your Razorpay / Stripe / Shopify create-order endpoint
 * using `useCart().items` and `useCart().total()` as the payload.
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { PRODUCTS, type Product } from "@/data/products";

const STORAGE_KEY = "mc_cart_v1";

export type CartLine = { slug: string; qty: number };

type CartCtx = {
  items: CartLine[];
  /** sum of qty across all lines */
  count: number;
  /** sum of price * qty across lines whose product has a numeric price */
  total: () => number;
  /** lines joined with their resolved product (skipped if slug no longer exists) */
  detailed: () => { line: CartLine; product: Product }[];
  add: (slug: string, qty?: number) => void;
  remove: (slug: string) => void;
  setQty: (slug: string, qty: number) => void;
  clear: () => void;
  /** true after the client has rehydrated from localStorage */
  ready: boolean;
};

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  // hydrate from localStorage once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {
      /* ignore — corrupt storage just starts empty */
    }
    setReady(true);
  }, []);

  // persist on change (skip until after hydration so we don't wipe storage)
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore — private mode etc. */
    }
  }, [items, ready]);

  const api = useMemo<CartCtx>(() => {
    const add = (slug: string, qty = 1) =>
      setItems((prev) => {
        const i = prev.findIndex((l) => l.slug === slug);
        if (i === -1) return [...prev, { slug, qty }];
        const next = [...prev];
        next[i] = { slug, qty: next[i].qty + qty };
        return next;
      });

    const remove = (slug: string) =>
      setItems((prev) => prev.filter((l) => l.slug !== slug));

    const setQty = (slug: string, qty: number) => {
      if (qty <= 0) return remove(slug);
      setItems((prev) => prev.map((l) => (l.slug === slug ? { slug, qty } : l)));
    };

    const clear = () => setItems([]);

    const detailed = () =>
      items
        .map((line) => {
          const product = PRODUCTS.find((p) => p.slug === line.slug);
          return product ? { line, product } : null;
        })
        .filter((x): x is { line: CartLine; product: Product } => Boolean(x));

    const total = () =>
      detailed().reduce(
        (sum, { line, product }) => sum + (product.price ?? 0) * line.qty,
        0
      );

    const count = items.reduce((s, l) => s + l.qty, 0);

    return { items, count, total, detailed, add, remove, setQty, clear, ready };
  }, [items, ready]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
