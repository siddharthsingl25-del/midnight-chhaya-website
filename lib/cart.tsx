"use client";

/**
 * Cart — client-only context + hook with localStorage persistence.
 *
 * The site has no payment gateway yet, so "checkout" still routes to
 * Instagram for inquiry. The cart stores `(slug, chainId?, qty)` lines;
 * product details (name, base price, image) are looked up from PRODUCTS,
 * and the chain variant (if any) is looked up from CHAIN_OPTIONS, both at
 * render time so prices stay in sync if the catalog is edited.
 *
 * Two lines with the same product slug but different chain selections are
 * tracked as separate lines (different variants).
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
import { chainById, type ChainOption } from "@/data/chains";

const STORAGE_KEY = "mc_cart_v2";

export type CartLine = { slug: string; chainId?: string; qty: number };

export type DetailedLine = {
  line: CartLine;
  product: Product;
  chain?: ChainOption;
  /** unit price (base + chain modifier) — null when product price is null */
  unitPrice: number | null;
};

type CartCtx = {
  items: CartLine[];
  /** sum of qty across all lines */
  count: number;
  /** sum of unitPrice * qty across all lines that have a numeric unitPrice */
  total: () => number;
  /** lines joined with their resolved product + chain */
  detailed: () => DetailedLine[];
  add: (slug: string, opts?: { chainId?: string; qty?: number }) => void;
  remove: (slug: string, chainId?: string) => void;
  setQty: (slug: string, qty: number, chainId?: string) => void;
  clear: () => void;
  /** true after the client has rehydrated from localStorage */
  ready: boolean;
};

const Ctx = createContext<CartCtx | null>(null);

/* Stable key for (slug + chain) match — handles undefined chainId. */
const keyOf = (l: { slug: string; chainId?: string }) =>
  `${l.slug}|${l.chainId ?? ""}`;

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
      /* corrupt storage → start empty */
    }
    setReady(true);
  }, []);

  // persist on change (skip until after hydration so we don't wipe storage)
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* private mode etc. */
    }
  }, [items, ready]);

  const api = useMemo<CartCtx>(() => {
    const add = (
      slug: string,
      opts?: { chainId?: string; qty?: number }
    ) => {
      const qty = opts?.qty ?? 1;
      const chainId = opts?.chainId;
      setItems((prev) => {
        const target = keyOf({ slug, chainId });
        const i = prev.findIndex((l) => keyOf(l) === target);
        if (i === -1) return [...prev, { slug, chainId, qty }];
        const next = [...prev];
        next[i] = { ...next[i], qty: next[i].qty + qty };
        return next;
      });
    };

    const remove = (slug: string, chainId?: string) => {
      const target = keyOf({ slug, chainId });
      setItems((prev) => prev.filter((l) => keyOf(l) !== target));
    };

    const setQty = (slug: string, qty: number, chainId?: string) => {
      if (qty <= 0) return remove(slug, chainId);
      const target = keyOf({ slug, chainId });
      setItems((prev) =>
        prev.map((l) => (keyOf(l) === target ? { ...l, qty } : l))
      );
    };

    const clear = () => setItems([]);

    const detailed = (): DetailedLine[] =>
      items
        .map((line): DetailedLine | null => {
          const product = PRODUCTS.find((p) => p.slug === line.slug);
          if (!product) return null;
          const chain = chainById(line.chainId);
          const unitPrice =
            product.price == null
              ? null
              : product.price + (chain?.priceModifier ?? 0);
          return { line, product, chain, unitPrice };
        })
        .filter((x): x is DetailedLine => Boolean(x));

    const total = () =>
      detailed().reduce(
        (sum, { line, unitPrice }) =>
          sum + (unitPrice ?? 0) * line.qty,
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
