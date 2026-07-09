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
  const { add, items: cartItems } = useCart();
  const [added, setAdded] = useState(false);
  const stock = useStock(product.slug);
  const soldOut = stock === 0;
  const chains = useChains();
  const hasChains = chains.length > 0;

  /* Block adding more if the customer already has every available
   * unit of this product in their cart. */
  const productInCart = cartItems
    .filter((l) => l.slug === product.slug)
    .reduce((s, l) => s + l.qty, 0);
  const productExhausted = stock !== null && productInCart >= stock;
  const disableInlineAdd = soldOut || productExhausted;

  const onAdd = () => {
    if (disableInlineAdd) return;
    add(product.slug, { qty: 1 });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <motion.div
      whileHover={soldOut ? undefined : "hover"}
      initial="rest"
      animate="rest"
      className="group h-full flex flex-col"
    >
      <Link
        href={`/collections/${product.slug}`}
        data-cursor={soldOut ? "Sold out" : "View"}
        className="block flex-1 flex flex-col"
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
              className="object-cover"
            />
            {/* Second photo (when uploaded): fades in on hover so the
             * customer sees the alternate angle without leaving the grid.
             * Uses Tailwind group-hover so the swap holds steady while
             * the cursor is over the card (was flickering with Framer
             * variants because of mount-time animations). */}
            {product.images[1] ? (
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out">
                <Image
                  src={product.images[1]}
                  alt={product.name}
                  fill
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                  className="object-cover"
                />
              </div>
            ) : null}
          </motion.div>

          {/* Top-left badge stack: sold-out always wins; otherwise show
           * the merchant's per-product graphic. Image overrides text. */}
          {soldOut ? (
            <span className="absolute top-3 left-3 px-3 py-1.5 bg-oxblood text-bone text-[10px] uppercase tracking-[0.25em] font-medium">
              Sold out
            </span>
          ) : product.badgeImage ? (
            <span className="absolute top-2 left-2 sm:top-3 sm:left-3 block w-12 sm:w-16 h-12 sm:h-16 pointer-events-none">
              <Image
                src={product.badgeImage}
                alt={product.badgeText ?? ""}
                fill
                sizes="64px"
                className="object-contain"
              />
            </span>
          ) : product.badgeText ? (
            <span className="absolute top-3 left-3 px-3 py-1.5 bg-gold text-ink text-[10px] uppercase tracking-[0.25em] font-medium">
              {product.badgeText}
            </span>
          ) : null}

          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </motion.div>

        <div className="mt-3 sm:mt-4 flex flex-col gap-1 flex-1">
          <h3 className="font-display text-sm sm:text-lg text-bone gold-underline inline-block leading-tight">
            {product.name}
          </h3>
          {product.isPreOrder ? (
            <span className="text-[9px] uppercase tracking-[0.2em] text-gold mt-1">
              Pre-order
            </span>
          ) : null}
          <span className="font-body text-sm sm:text-base text-bone mt-auto pt-1 flex items-baseline gap-2 flex-wrap">
            <span>{formatPrice(product.price)}</span>
            {product.isPreOrder &&
            product.launchPrice != null &&
            product.price != null &&
            product.launchPrice > product.price ? (
              <span className="text-[11px] sm:text-xs text-bone-dim line-through">
                {formatPrice(product.launchPrice)}
              </span>
            ) : null}
          </span>
        </div>
      </Link>

      {/* Action: sold-out > chain picker > inline add */}
      {soldOut ? (
        <div
          aria-label={`${product.name} sold out`}
          className="mt-2 sm:mt-3 w-full inline-flex items-center justify-center gap-2 py-2.5 sm:py-3
                     border border-oxblood/40 text-oxblood/80"
        >
          <span className="eyebrow text-[10px]">Sold out</span>
        </div>
      ) : (product.variantKind ??
          (product.category === "chains" && hasChains ? "chain" : null)) ? (
        (() => {
          const vk =
            product.variantKind ??
            (product.category === "chains" ? "chain" : null);
          const label =
            vk === "car"
              ? "Choose car"
              : vk === "color"
                ? "Choose colour"
                : "Choose chain";
          return (
            <Link
              href={`/collections/${product.slug}`}
              data-cursor={label}
              aria-label={`${label} for ${product.name}`}
              className="mt-2 sm:mt-3 w-full inline-flex items-center justify-center gap-2 py-2.5 sm:py-3
                         bg-gold text-ink
                         hover:bg-gold-soft transition-colors duration-300"
            >
              <span className="eyebrow text-[10px] sm:text-xs text-ink">{label}</span>
              <ArrowRight size={14} strokeWidth={1.75} />
            </Link>
          );
        })()
      ) : productExhausted ? (
        <div
          aria-label={`${product.name} max in cart`}
          className="mt-2 sm:mt-3 w-full inline-flex items-center justify-center gap-2 py-2.5 sm:py-3
                     border border-bone/15 text-bone-dim"
        >
          <span className="eyebrow text-[10px] sm:text-xs">Max in cart</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={onAdd}
          disabled={disableInlineAdd}
          data-cursor={added ? "Added" : "Add to cart"}
          aria-label={`Add ${product.name} to cart`}
          className={[
            "mt-2 sm:mt-3 w-full inline-flex items-center justify-center gap-2 py-2.5 sm:py-3",
            "transition-colors duration-300",
            added
              ? "bg-gold-soft text-ink"
              : "bg-gold text-ink hover:bg-gold-soft",
            "disabled:opacity-40 disabled:cursor-not-allowed",
          ].join(" ")}
        >
          {added ? (
            <>
              <Check size={14} strokeWidth={1.75} />
              <span className="eyebrow text-[10px] sm:text-xs text-ink">Added</span>
            </>
          ) : (
            <>
              <Plus size={14} strokeWidth={1.75} />
              <span className="eyebrow text-[10px] sm:text-xs text-ink">
                {product.isPreOrder ? "Pre-order now" : "Add to cart"}
              </span>
            </>
          )}
        </button>
      )}
    </motion.div>
  );
}
