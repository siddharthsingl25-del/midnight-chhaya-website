"use client";

/**
 * Pre-order announcement bar. Sits at the very top of every page,
 * above the countdown promo banner and the header.
 *
 * Rotates through every pre-order product in the catalog, cycling
 * once every 3 seconds so multiple offers get airtime. Auto-hides
 * when there are no pre-order products — just untick the flag on
 * the product and this disappears.
 */

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useProducts } from "@/lib/catalog-context";
import { formatPrice } from "@/lib/site";
import type { Product } from "@/lib/types";

const ROTATE_MS = 3000;

export default function PreOrderBanner() {
  const products = useProducts();
  const preOrders: Product[] = products.filter((p) => p.isPreOrder);
  const [index, setIndex] = useState(0);

  // Rotate the slide every ROTATE_MS. Reset if the list length changes
  // (e.g. merchant toggles pre-order on/off while a customer is browsing).
  useEffect(() => {
    if (preOrders.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % preOrders.length);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [preOrders.length]);

  if (preOrders.length === 0) return null;

  const safeIndex = index % preOrders.length;
  const current = preOrders[safeIndex];
  const href = `/collections/${current.slug}`;
  const label =
    current.price != null
      ? `Pre-order ${current.name} at ${formatPrice(current.price)}`
      : `Pre-order ${current.name} now`;

  return (
    <div
      style={{ height: "32px" }}
      className="fixed top-0 left-0 right-0 z-[70] w-full bg-gold text-ink
                 border-b border-gold-soft overflow-hidden"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={safeIndex}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <Link
            href={href}
            className="flex w-full h-full items-center justify-center px-4
                       text-[11px] sm:text-xs uppercase tracking-[0.18em]
                       font-medium hover:bg-gold-soft transition-colors duration-500"
          >
            <span>{label}</span>
            <span className="ml-3 opacity-60">→</span>
          </Link>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
