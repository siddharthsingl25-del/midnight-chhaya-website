"use client";

/**
 * Homepage announcement for a specific promo code (e.g. FIRST10).
 * Fetches the code's status from /api/promo so the "only N left" line
 * updates as customers claim the offer. Auto-hides when the code
 * runs out of uses or gets deactivated in Supabase.
 */

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/site";
import Reveal from "@/components/animations/Reveal";

const CODE = "FIRST10";

type PromoData = {
  code: string;
  percentOff: number;
  flatAmountOff: number;
  minSubtotal: number;
  maxUses: number | null;
  timesUsed: number;
  usesLeft: number | null;
  active: boolean;
};

export default function PromoCodeAnnouncement() {
  const [promo, setPromo] = useState<PromoData | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/promo?code=${CODE}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as Partial<PromoData>;
        if (data.active && data.code) setPromo(data as PromoData);
      } catch {
        /* silent */
      }
    };
    void load();
  }, []);

  if (!promo) return null;
  if (promo.usesLeft != null && promo.usesLeft <= 0) return null;

  const discountLabel =
    promo.percentOff > 0
      ? `${promo.percentOff}% off`
      : `${formatPrice(promo.flatAmountOff)} off`;

  return (
    <section className="relative px-6 md:px-10 py-16 md:py-20 border-b border-bone/10">
      <div className="mx-auto max-w-[1400px]">
        <Reveal>
          <div
            className="relative overflow-hidden border border-gold/40 bg-gradient-to-b from-gold/10 via-transparent to-transparent
                       px-6 sm:px-10 py-10 sm:py-12 text-center"
          >
            <span className="eyebrow text-gold text-[11px]">First-drop offer</span>
            <h2 className="font-display uppercase text-bone text-[clamp(1.75rem,5vw,3.25rem)] leading-[1.05] mt-3">
              First 10 customers get {discountLabel}.
            </h2>
            <p className="font-serif italic text-bone-dim text-base sm:text-lg mt-4 max-w-xl mx-auto">
              Spend {formatPrice(promo.minSubtotal)} or more and use the code below at
              checkout. Only for the first 10 customers.
            </p>

            <div className="mt-8 inline-flex flex-col items-center">
              <div
                className="border border-gold/60 bg-ink/40 px-8 py-4
                           font-display text-gold text-2xl sm:text-3xl uppercase tracking-[0.35em]"
              >
                {promo.code}
              </div>
              {promo.usesLeft != null ? (
                <p className="text-[11px] text-bone-dim uppercase tracking-[0.2em] mt-4">
                  {promo.usesLeft === promo.maxUses
                    ? `Only ${promo.usesLeft} uses available`
                    : promo.usesLeft === 1
                      ? "1 use left"
                      : `${promo.usesLeft} uses left`}
                </p>
              ) : null}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
