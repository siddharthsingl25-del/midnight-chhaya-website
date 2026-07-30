/**
 * Homepage category grid — 5 tiles right under the hero.
 *
 * Each tile pulls the first product image from its category as the
 * backdrop, with the category name overlaid. Clicking a tile drops
 * the shopper into /collections?cat=<slug> pre-filtered.
 *
 * Server component — fetches products at request time via the same
 * cache as the rest of the catalog.
 */

import Image from "next/image";
import Link from "next/link";
import { getAllProducts } from "@/lib/catalog";
import type { Category } from "@/lib/types";

type Tile = {
  label: string;
  cat: Category;
  href: string;
};

const TILES: readonly Tile[] = [
  { label: "Chains",    cat: "chains",    href: "/collections?cat=chains" },
  { label: "Keychains", cat: "keychains", href: "/collections?cat=keychains" },
  { label: "Rings",     cat: "rings",     href: "/collections?cat=rings" },
  { label: "Glasses",   cat: "glasses",   href: "/collections?cat=glasses" },
  { label: "Earbuds",   cat: "earbuds",   href: "/collections?cat=earbuds" },
];

export default async function CategoryTiles() {
  const products = await getAllProducts();

  // Pick one representative image per category — the first product in
  // display_order that has any image. Null if the category is empty; the
  // tile still renders (dark box with just the name).
  const imageByCat = new Map<Category, string | null>();
  for (const t of TILES) {
    const first = products.find(
      (p) => p.category === t.cat && (p.images?.length ?? 0) > 0
    );
    imageByCat.set(t.cat, first?.images?.[0] ?? null);
  }

  return (
    <section className="w-full bg-ink px-4 sm:px-6 pt-6 pb-16">
      <ul className="mx-auto max-w-[1400px] grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {TILES.map((t) => {
          const src = imageByCat.get(t.cat) ?? null;
          return (
            <li key={t.cat}>
              <Link
                href={t.href}
                data-cursor="Shop"
                className="group relative block aspect-square overflow-hidden bg-charcoal border border-bone/10 hover:border-gold/50 transition-colors"
              >
                {src ? (
                  <Image
                    src={src}
                    alt={t.label}
                    fill
                    sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                ) : null}

                {/* Slim bottom-only gradient — just enough to keep the
                 * label readable without dimming the photo itself. */}
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/90 to-transparent" />

                {/* Label */}
                <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 text-center">
                  <p
                    className="font-display text-bone text-base sm:text-lg tracking-wide group-hover:text-gold transition-colors"
                    style={{ textShadow: "0 2px 8px rgba(0,0,0,0.85)" }}
                  >
                    {t.label}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
