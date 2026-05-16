"use client";

/**
 * Product card. Used in collections grid + featured-pieces section.
 *
 * Hover: card lifts ~6px, image inside scales to 1.04, gold underline
 * animates in under the product name.
 */

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { easeHover } from "@/lib/animations";
import { formatPrice } from "@/lib/site";
import type { Product } from "@/data/products";

export default function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  return (
    <motion.div
      whileHover="hover"
      initial="rest"
      animate="rest"
      className="group block"
    >
      <Link
        href={`/collections/${product.slug}`}
        data-cursor="View"
        className="block"
      >
        <motion.div
          variants={{
            rest: { y: 0 },
            hover: { y: -6 },
          }}
          transition={{ duration: 0.6, ease: easeHover }}
          className="relative aspect-[4/5] w-full overflow-hidden bg-charcoal"
        >
          <motion.div
            className="absolute inset-0"
            variants={{
              rest: { scale: 1 },
              hover: { scale: 1.04 },
            }}
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
          {/* subtle gradient at bottom for legibility if we ever overlay text */}
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
          <span className="font-body text-sm text-gold whitespace-nowrap pt-1">
            {formatPrice(product.price)}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
