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
  /** Category to filter by. 'exclusive' is a special virtual category
   * that pulls products with the .exclusive DB flag regardless of their
   * real category. */
  cat: Category | "exclusive";
  href: string;
  /** Pin a specific product's image as the tile backdrop. If null / not
   * found, falls back to the first product in the category. */
  pinnedSlug?: string;
};

const TILES: readonly Tile[] = [
  { label: "Exclusive", cat: "exclusive", href: "/collections?filter=exclusive" },
  { label: "Chains",    cat: "chains",    href: "/collections?cat=chains",    pinnedSlug: "crimson-filigree-cross" },
  { label: "Keychains", cat: "keychains", href: "/collections?cat=keychains" },
  { label: "Rings",     cat: "rings",     href: "/collections?cat=rings" },
  { label: "Bracelets", cat: "bracelets", href: "/collections?cat=bracelets" },
  { label: "Glasses",   cat: "glasses",   href: "/collections?cat=glasses" },
  { label: "Earbuds",   cat: "earbuds",   href: "/collections?cat=earbuds" },
  { label: "Wallets",   cat: "wallets",   href: "/collections?cat=wallets" },
];

export default async function CategoryTiles() {
  const products = await getAllProducts();

  // Pick one representative image per tile. Order of precedence:
  //   1. pinnedSlug (explicit product chosen for this tile)
  //   2. For 'exclusive' — first product with .exclusive flag + an image
  //   3. Otherwise — first product in the category with an image
  // Null → tile still renders as a dark box with just the label.
  const imageByCat = new Map<Tile["cat"], string | null>();
  for (const t of TILES) {
    const pinned = t.pinnedSlug
      ? products.find((p) => p.slug === t.pinnedSlug && (p.images?.length ?? 0) > 0)
      : null;
    const fallback = pinned
      ? null
      : t.cat === "exclusive"
        ? products.find((p) => p.exclusive && (p.images?.length ?? 0) > 0)
        : products.find(
            (p) => p.category === t.cat && (p.images?.length ?? 0) > 0
          );
    imageByCat.set(t.cat, (pinned ?? fallback)?.images?.[0] ?? null);
  }

  return (
    <section className="w-full bg-ink px-4 sm:px-6 pt-6 pb-16">
      <ul className="mx-auto max-w-[1500px] grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
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
