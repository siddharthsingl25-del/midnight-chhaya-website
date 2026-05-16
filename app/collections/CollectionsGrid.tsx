"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProductCard from "@/components/ui/ProductCard";
import { CATEGORIES, PRODUCTS, type Category } from "@/data/products";
import { easeCinematic } from "@/lib/animations";

export default function CollectionsGrid() {
  const [active, setActive] = useState<Category | "all">("all");

  const items = useMemo(
    () => (active === "all" ? PRODUCTS : PRODUCTS.filter((p) => p.category === active)),
    [active]
  );

  return (
    <section className="px-6 md:px-10 pb-32">
      <div className="mx-auto max-w-[1400px]">
        {/* filter rail */}
        <div className="flex flex-wrap gap-x-8 gap-y-3 mb-16 border-b border-bone/10 pb-6">
          {CATEGORIES.map((c) => {
            const selected = c.id === active;
            return (
              <button
                key={c.id}
                onClick={() => setActive(c.id)}
                data-cursor={c.label}
                className={[
                  "relative eyebrow transition-colors duration-500",
                  selected ? "text-gold" : "text-bone-dim hover:text-bone",
                ].join(" ")}
              >
                {c.label}
                {selected ? (
                  <motion.span
                    layoutId="cat-underline"
                    className="absolute -bottom-[26px] left-0 right-0 h-px bg-gold"
                    transition={{ duration: 0.5, ease: easeCinematic }}
                  />
                ) : null}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.6, ease: easeCinematic }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 md:gap-x-10 gap-y-16"
          >
            {items.map((p, i) => (
              <motion.div
                key={p.slug}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.8,
                  ease: easeCinematic,
                  delay: i * 0.06,
                }}
              >
                <ProductCard product={p} priority={i < 3} />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {items.length === 0 ? (
          <p className="font-serif italic text-bone-dim text-center py-32">
            No pieces in this category yet — check back soon.
          </p>
        ) : null}
      </div>
    </section>
  );
}
