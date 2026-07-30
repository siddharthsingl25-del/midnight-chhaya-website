/**
 * Homepage two-item showcase — full-bleed side-by-side hero blocks.
 *
 * Sits below CategoryTiles. Two products get a large-format spotlight
 * (one per column on desktop, stacked on mobile), each pulling the
 * shopper straight to the product page.
 *
 * Products to spotlight are named by slug in SHOWCASE_SLUGS below.
 * If a slug isn't found in the catalog (renamed / deleted), that column
 * just doesn't render — no broken box.
 */

import Image from "next/image";
import Link from "next/link";
import { getAllProducts } from "@/lib/catalog";
import { formatPrice } from "@/lib/site";

const SHOWCASE_SLUGS: readonly string[] = [
  "white-monster",
  "y2k-ring-1-0",
];

export default async function FeaturedShowcase() {
  const products = await getAllProducts();
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const items = SHOWCASE_SLUGS.map((s) => bySlug.get(s)).filter(Boolean) as NonNullable<
    ReturnType<typeof bySlug.get>
  >[];
  if (items.length === 0) return null;

  return (
    <section className="w-full bg-ink">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
        {items.map((p) => {
          const img = p.images?.[0] ?? null;
          return (
            <Link
              key={p.slug}
              href={`/collections/${p.slug}`}
              data-cursor="Shop"
              className="group relative block h-[70svh] md:h-[85svh] min-h-[500px] overflow-hidden bg-charcoal"
            >
              {img ? (
                <Image
                  src={img}
                  alt={p.name}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover group-hover:scale-[1.03] transition-transform duration-[900ms] ease-out"
                />
              ) : null}

              {/* Subtle bottom gradient so the text always reads */}
              <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-ink/90 via-ink/40 to-transparent" />

              {/* Product name + price + CTA */}
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10 flex items-end justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <h3
                    className="font-display text-bone text-2xl sm:text-3xl md:text-4xl tracking-wide group-hover:text-gold transition-colors"
                    style={{ textShadow: "0 2px 12px rgba(0,0,0,0.85)" }}
                  >
                    {p.name}
                  </h3>
                  <p
                    className="font-body text-bone text-lg sm:text-xl"
                    style={{ textShadow: "0 2px 12px rgba(0,0,0,0.85)" }}
                  >
                    {formatPrice(p.price)}
                  </p>
                </div>
                <span
                  className="eyebrow text-[11px] px-4 py-2 border border-bone/40 text-bone
                             group-hover:border-gold group-hover:text-gold transition-colors
                             backdrop-blur-sm bg-ink/20"
                >
                  Shop →
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
