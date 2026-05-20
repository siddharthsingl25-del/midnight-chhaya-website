"use client";

/**
 * Cart — client-only context + hook with localStorage persistence.
 *
 * Cart state stores `(slug, chainId?, qty)` lines. Product details
 * (name, price, image) and chain details (name, image, price modifier)
 * are resolved at render time from the catalog context, so a cart line
 * always reflects the latest catalog state. If a slug is deleted from
 * the admin while a customer has it in their cart, the line is just
 * silently dropped from `detailed()`.
 *
 * To wire to real checkout: replace the inquiry CTA in CartButton with
 * a call to your payment gateway (Razorpay create-order route) using
 * `useCart().items` and `useCart().total()` as the payload.
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useProducts, useChains } from "./catalog-context";
import type { ChainOption, Product } from "./types";

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
  count: number;
  total: () => number;
  detailed: () => DetailedLine[];
  add: (slug: string, opts?: { chainId?: string; qty?: number }) => void;
  remove: (slug: string, chainId?: string) => void;
  setQty: (slug: string, qty: number, chainId?: string) => void;
  clear: () => void;
  ready: boolean;
};

const Ctx = createContext<CartCtx | null>(null);

const keyOf = (l: { slug: string; chainId?: string }) =>
  `${l.slug}|${l.chainId ?? ""}`;

export function CartProvider({ children }: { children: ReactNode }) {
  const products = useProducts();
  const chains = useChains();
  const [items, setItems] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

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
          const product = products.find((p) => p.slug === line.slug);
          if (!product) return null;
          const chain = line.chainId
            ? chains.find((c) => c.id === line.chainId)
            : undefined;
          const unitPrice =
            product.price == null
              ? null
              : product.price + (chain?.priceModifier ?? 0);
          return { line, product, chain, unitPrice };
        })
        .filter((x): x is DetailedLine => Boolean(x));

    const total = () =>
      detailed().reduce(
        (sum, { line, unitPrice }) => sum + (unitPrice ?? 0) * line.qty,
        0
      );

    const count = items.reduce((s, l) => s + l.qty, 0);

    return { items, count, total, detailed, add, remove, setQty, clear, ready };
  }, [items, ready, products, chains]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
