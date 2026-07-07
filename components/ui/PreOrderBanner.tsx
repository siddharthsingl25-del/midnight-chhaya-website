"use client";

/**
 * Pre-order announcement bar. Sits at the very top of every page,
 * above the countdown promo banner and the header. Auto-hides when
 * there are no pre-order products in the catalog, so the merchant
 * doesn't need to toggle a flag once launch happens — just untick
 * "Currently taking pre-orders" on the product and this disappears.
 *
 * Copy is derived from the FIRST pre-order product found (usually
 * there's only one at a time). Falls back to a generic message when
 * name/price can't be resolved.
 */

import Link from "next/link";
import { useProducts } from "@/lib/catalog-context";
import { formatPrice } from "@/lib/site";

export default function PreOrderBanner() {
  const products = useProducts();
  const preOrders = products.filter((p) => p.isPreOrder);
  if (preOrders.length === 0) return null;

  const primary = preOrders[0];
  const href =
    preOrders.length === 1
      ? `/collections/${primary.slug}`
      : `/collections?cat=${primary.category}`;

  const label =
    primary.price != null
      ? `Pre-order ${primary.name} at ${formatPrice(primary.price)}`
      : `Pre-order ${primary.name} now`;

  return (
    <Link
      href={href}
      className="relative z-[70] block w-full bg-ink text-gold py-2 px-4
                 text-center text-[11px] sm:text-xs uppercase tracking-[0.18em]
                 font-medium border-b border-gold/30
                 hover:bg-gold hover:text-ink transition-colors duration-500"
    >
      {label}
      <span className="ml-3 opacity-60">→</span>
    </Link>
  );
}
