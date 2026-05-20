"use client";

/**
 * Chain selector — tile picker for chains-category products.
 *
 * Renders a row of small image+label tiles. Selected tile shows a gold
 * border and a checkmark. Auto-selects the first option on mount unless
 * a value is already set.
 *
 * Each tile has a small magnify button (top-left) — clicking opens a
 * lightbox showing the chain at full size. Tile body click selects.
 *
 * Hides itself if CHAIN_OPTIONS is empty (so the rest of the UI works
 * before any chain photos exist).
 */

import Image from "next/image";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Maximize2, X } from "lucide-react";
import { useChains } from "@/lib/catalog-context";
import type { ChainOption } from "@/lib/types";
import { easeCinematic } from "@/lib/animations";
import { formatPrice } from "@/lib/site";

export default function ChainSelector({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (id: string) => void;
}) {
  const CHAIN_OPTIONS = useChains();
  const [preview, setPreview] = useState<ChainOption | null>(null);

  // auto-pick the first chain on mount so the cart always has a variant
  useEffect(() => {
    if (!value && CHAIN_OPTIONS.length > 0) {
      onChange(CHAIN_OPTIONS[0].id);
    }
  }, [value, onChange, CHAIN_OPTIONS]);

  // close preview on Escape, lock body scroll while open
  useEffect(() => {
    if (!preview) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreview(null);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [preview]);

  if (CHAIN_OPTIONS.length === 0) return null;

  return (
    <>
      <div className="flex flex-col gap-4">
        <span className="eyebrow text-bone-dim">Choose a chain</span>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {CHAIN_OPTIONS.map((opt) => {
            const selected = opt.id === value;
            return (
              <div
                key={opt.id}
                className={[
                  "group relative flex flex-col gap-2 p-2",
                  "border transition-colors duration-500",
                  selected
                    ? "border-gold bg-gold/5"
                    : "border-bone/15 hover:border-bone/40",
                ].join(" ")}
              >
                <button
                  type="button"
                  onClick={() => onChange(opt.id)}
                  data-cursor={opt.name}
                  aria-pressed={selected}
                  aria-label={`Select ${opt.name}`}
                  className="block w-full text-left"
                >
                  <div className="relative w-full aspect-square overflow-hidden bg-charcoal">
                    <Image
                      src={opt.image}
                      alt={opt.name}
                      fill
                      sizes="120px"
                      className="object-cover"
                    />
                    {selected ? (
                      <span className="absolute top-1.5 right-1.5 grid place-items-center w-5 h-5 rounded-full bg-gold text-ink">
                        <Check size={12} strokeWidth={2} />
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-2 flex flex-col gap-0.5">
                    <span
                      className={[
                        "text-xs leading-tight tracking-wide",
                        selected ? "text-bone" : "text-bone-dim",
                      ].join(" ")}
                    >
                      {opt.name}
                    </span>
                    {opt.priceModifier ? (
                      <span className="text-[10px] text-bone uppercase tracking-[0.2em]">
                        +{formatPrice(opt.priceModifier)}
                      </span>
                    ) : null}
                  </div>
                </button>

                {/* magnify button — opens full-size preview, stops the
                 * event so the underlying select button does not fire.
                 * Always visible on touch (no hover); fades in on hover
                 * on hover-capable devices. */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreview(opt);
                  }}
                  data-cursor="View"
                  aria-label={`View ${opt.name} at full size`}
                  className="absolute top-3 left-3 grid place-items-center w-8 h-8
                             bg-ink/70 backdrop-blur-sm text-bone
                             opacity-0 [@media(hover:none)]:opacity-100
                             group-hover:opacity-100 focus:opacity-100
                             hover:bg-gold hover:text-ink
                             transition-all duration-300"
                >
                  <Maximize2 size={14} strokeWidth={1.75} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full-size preview lightbox */}
      <AnimatePresence>
        {preview ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: easeCinematic }}
            className="fixed inset-0 z-[130] bg-ink/95 backdrop-blur-sm
                       flex items-center justify-center p-6 sm:p-12"
            onClick={() => setPreview(null)}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setPreview(null); }}
              aria-label="Close"
              data-cursor="Close"
              className="absolute top-6 right-6 text-bone-dim hover:text-gold transition-colors p-3"
            >
              <X size={22} strokeWidth={1.25} />
            </button>

            <motion.div
              key={preview.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.5, ease: easeCinematic }}
              className="relative w-full max-w-2xl aspect-[3/4]"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={preview.image}
                alt={preview.name}
                fill
                sizes="100vw"
                priority
                className="object-contain"
              />
              <span className="absolute -bottom-10 left-0 right-0 text-center eyebrow text-bone-dim">
                {preview.name}
              </span>
            </motion.div>

            {/* Quick action bar below — select + close */}
            <div
              className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  onChange(preview.id);
                  setPreview(null);
                }}
                data-cursor="Select"
                className="inline-flex items-center gap-2 px-6 py-3
                           bg-gold text-ink eyebrow text-[10px]
                           transition-colors duration-500
                           hover:bg-gold-soft"
              >
                <Check size={12} strokeWidth={2} />
                Select this chain
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
