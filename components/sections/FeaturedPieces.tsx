"use client";

/**
 * Featured Pieces — home section.
 * Editorial asymmetric layout: three columns desktop with vertical offsets,
 * single column mobile. Each card reveals on scroll (stagger via index).
 */

import Link from "next/link";
import ProductCard from "@/components/ui/ProductCard";
import SectionHeading from "@/components/ui/SectionHeading";
import Reveal from "@/components/animations/Reveal";
import { useProducts } from "@/lib/catalog-context";
import { useStockMap } from "@/lib/stock";

export default function FeaturedPieces() {
  const products = useProducts();
  const stockMap = useStockMap();
  // Sold-out featured pieces sink to the bottom of the four shown.
  const items = [...products.filter((p) => p.featured)]
    .sort((a, b) => {
      const sa = (stockMap[a.slug] ?? 1) <= 0 ? 1 : 0;
      const sb = (stockMap[b.slug] ?? 1) <= 0 ? 1 : 0;
      return sa - sb;
    })
    .slice(0, 4);
  if (items.length === 0) return null;
  // vertical offsets in rem applied to each column (desktop only) for the
  // staggered-magazine feel. Keep 0/translate/0/translate pattern.
  const offsets = ["0rem", "3rem", "0rem", "4rem"];

  return (
    <section id="featured" className="relative px-6 md:px-10 py-28 md:py-40">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16 md:mb-24">
          <SectionHeading eyebrow="The Collection" title="Featured pieces." />
          <Reveal delay={0.2}>
            <Link
              href="/collections"
              data-cursor="See all"
              className="eyebrow inline-flex items-center gap-2 px-6 py-3
                         bg-gold text-ink
                         hover:bg-gold-soft transition-colors duration-300
                         shadow-[0_0_24px_-8px_rgba(184,147,90,0.5)]
                         hover:shadow-[0_0_36px_-6px_rgba(184,147,90,0.7)]"
            >
              See all <span aria-hidden>→</span>
            </Link>
          </Reveal>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 sm:gap-x-6 md:gap-x-10 gap-y-10 sm:gap-y-16 md:gap-y-0">
          {items.map((p, i) => (
            <Reveal
              key={p.slug}
              delay={i * 0.12}
              y={48}
              amount={0.15}
              className="block"
            >
              <div style={{ transform: `translateY(${offsets[i] ?? "0rem"})` }}>
                <ProductCard product={p} priority={i < 2} />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
