"use client";

/**
 * Product card. Used in collections grid + featured-pieces section.
 *
 * Hover: card lifts ~6px, image inside scales to 1.04, gold underline
 * animates in under the product name.
 *
 * Live stock from useStock(slug):
 *   - null  → unknown (Supabase not yet loaded / not configured) → behave
 *             as before, no badge
 *   - 0     → "Sold out" badge over the image; Add-to-cart disabled
 *   - 1..3  → "Only N left" gold badge top-left
 *   - 4+    → no badge
 */

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, Plus } from "lucide-react";
import { easeHover } from "@/lib/animations";
import { formatPrice } from "@/lib/site";
import { useCart } from "@/lib/cart";
import { useStock } from "@/lib/stock";
import { useChains } from "@/lib/catalog-context";
import type { Product } from "@/lib/types";

export default function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const stock = useStock(product.slug);
  const soldOut = stock === 0;
  const chains = useChains();
  const hasChains = chains.length > 0;

  const onAdd = () => {
    if (soldOut) return;
    add(product.slug, { qty: 1 });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <motion.div
      whileHover={soldOut ? undefined : "hover"}
      initial="rest"
      animate="rest"
      className="group block"
    >
      <Link
        href={`/collections/${product.slug}`}
        data-cursor={soldOut ? "Sold out" : "View"}
        className="block"
      >
        <motion.div
          variants={{ rest: { y: 0 }, hover: { y: -6 } }}
          transition={{ duration: 0.6, ease: easeHover }}
          className="relative aspect-[4/5] w-full overflow-hidden bg-charcoal"
        >
          <motion.div
            className="absolute inset-0"
            variants={{ rest: { scale: 1 }, hover: { scale: 1.04 } }}
            transition={{ duration: 0.9, ease: easeHover }}
          >
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              priority={priority}
              sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
              className="object-cover grayscale-[0.25] group-hover:grayscale-0
                         transition-[filter] duration-700"
            />
          </motion.div>

          {/* Stock badges */}
          {soldOut ? (
            <span className="absolute top-3 left-3 px-3 py-1.5 bg-oxblood text-bone text-[10px] uppercase tracking-[0.25em] font-medium">
              Sold out
            </span>
          ) : stock !== null && stock <= 3 ? (
            <span className="absolute top-3 left-3 px-3 py-1.5 bg-gold/90 text-ink text-[10px] uppercase tracking-[0.25em] font-medium">
              Only {stock} left
            </span>
          ) : null}

          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </motion.div>

        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-base sm:text-lg text-bone gold-underline inline-block">
              {product.name}
            </h3>
            <p className="mt-1 eyebrow text-bone-dim normal-case tracking-[0.2em]">
              {product.shortDescription}
            </p>
          </div>
          <span className="font-body text-sm text-bone whitespace-nowrap pt-1">
            {formatPrice(product.price)}
          </span>
        </div>
      </Link>

      {/* Action: sold-out > chain picker > inline add */}
      {soldOut ? (
        <div
          aria-label={`${product.name} sold out`}
          className="mt-3 w-full inline-flex items-center justify-center gap-2 py-2.5
                     border border-oxblood/40 text-oxblood/80"
        >
          <span className="eyebrow text-[10px]">Sold out</span>
        </div>
      ) : product.category === "chains" && hasChains ? (
        <Link
          href={`/collections/${product.slug}`}
          data-cursor="Choose chain"
          aria-label={`Choose chain for ${product.name}`}
          className="mt-3 w-full inline-flex items-center justify-center gap-2 py-2.5
                     border border-bone/15 text-bone-dim
                     hover:border-gold hover:text-gold
                     transition-colors duration-500"
        >
          <span className="eyebrow text-[10px]">Choose chain</span>
          <ArrowRight size={14} strokeWidth={1.5} />
        </Link>
      ) : (
        <button
          type="button"
          onClick={onAdd}
          data-cursor={added ? "Added" : "Add to cart"}
          aria-label={`Add ${product.name} to cart`}
          className={[
            "mt-3 w-full inline-flex items-center justify-center gap-2 py-2.5",
            "border transition-colors duration-500",
            added
              ? "border-gold text-gold bg-gold/5"
              : "border-bone/15 text-bone-dim hover:border-gold hover:text-gold",
          ].join(" ")}
        >
          {added ? (
            <>
              <Check size={14} strokeWidth={1.5} />
              <span className="eyebrow text-[10px]">Added</span>
            </>
          ) : (
            <>
              <Plus size={14} strokeWidth={1.5} />
              <span className="eyebrow text-[10px]">Add to cart</span>
            </>
          )}
        </button>
      )}
    </motion.div>
  );
}
