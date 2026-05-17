"use client";

/**
 * Chain selector — tile picker for chains-category products.
 *
 * Renders a row of small image+label tiles. Selected tile shows a gold
 * border and a checkmark. Auto-selects the first option on mount unless
 * a value is already set.
 *
 * Hides itself if CHAIN_OPTIONS is empty (so the rest of the UI works
 * before any chain photos exist).
 */

import Image from "next/image";
import { useEffect } from "react";
import { Check } from "lucide-react";
import { CHAIN_OPTIONS, hasChainOptions } from "@/data/chains";
import { formatPrice } from "@/lib/site";

export default function ChainSelector({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (id: string) => void;
}) {
  // auto-pick the first chain on mount so the cart always has a variant
  useEffect(() => {
    if (!value && CHAIN_OPTIONS.length > 0) {
      onChange(CHAIN_OPTIONS[0].id);
    }
  }, [value, onChange]);

  if (!hasChainOptions()) return null;

  return (
    <div className="flex flex-col gap-4">
      <span className="eyebrow text-bone-dim">Choose a chain</span>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {CHAIN_OPTIONS.map((opt) => {
          const selected = opt.id === value;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              data-cursor={opt.name}
              aria-pressed={selected}
              className={[
                "group relative flex flex-col gap-2 p-2",
                "border transition-colors duration-500 text-left",
                selected
                  ? "border-gold bg-gold/5"
                  : "border-bone/15 hover:border-bone/40",
              ].join(" ")}
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
              <span
                className={[
                  "text-xs leading-tight tracking-wide",
                  selected ? "text-bone" : "text-bone-dim",
                ].join(" ")}
              >
                {opt.name}
              </span>
              {opt.priceModifier ? (
                <span className="text-[10px] text-gold uppercase tracking-[0.2em]">
                  +{formatPrice(opt.priceModifier)}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
