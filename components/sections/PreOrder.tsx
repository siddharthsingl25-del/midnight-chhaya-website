"use client";

/**
 * Pre-order section — home page.
 *
 * Shows every product currently flagged is_pre_order in the catalog.
 * Renders nothing if the catalog has no pre-order items, so the section
 * hides itself automatically once the merchant flips them off after launch.
 *
 * Sits between Hero and Featured Pieces so it's the first collection block
 * the visitor sees when they scroll below the logo.
 */

import ProductCard from "@/components/ui/ProductCard";
import SectionHeading from "@/components/ui/SectionHeading";
import Reveal from "@/components/animations/Reveal";
import { useProducts } from "@/lib/catalog-context";

export default function PreOrder() {
  const products = useProducts();
  const items = products.filter((p) => p.isPreOrder);
  if (items.length === 0) return null;

  return (
    <section
      id="pre-order"
      className="relative px-6 md:px-10 py-24 md:py-32 border-b border-bone/10"
    >
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 md:mb-16">
          <SectionHeading eyebrow="Pre-order" title="Pre-order now." />
          <Reveal delay={0.2}>
            <p className="font-serif italic text-bone-dim text-sm md:text-base max-w-md">
              Reserve at the pre-order price. Ships when the collection drops.
            </p>
          </Reveal>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 sm:gap-x-6 md:gap-x-10 gap-y-10 sm:gap-y-16">
          {items.slice(0, 8).map((p, i) => (
            <Reveal
              key={p.slug}
              delay={i * 0.1}
              y={48}
              amount={0.15}
              className="block"
            >
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
