"use client";

/**
 * Big site-wide restock announcement on the homepage.
 *
 * Deliberately a plain constant rather than a CMS field — same pattern as
 * BANNER_MESSAGES in PreOrderBanner. To change the date, edit HEADLINE. To
 * take the whole block down once stock lands, set SHOW to false (or delete
 * <RestockAnnouncement /> from app/page.tsx).
 */

import Reveal from "@/components/animations/Reveal";

/** Flip to false to hide the announcement without touching app/page.tsx. */
const SHOW = true;

const EYEBROW = "Restock update";
const HEADLINE = "Everything restocking by 1 September";
const SUBLINE =
  "Every sold-out piece is on its way back. Message us on Instagram and we'll tell you the moment your size or colour lands.";

export default function RestockAnnouncement() {
  if (!SHOW) return null;

  return (
    <section className="relative px-6 md:px-10 py-20 md:py-28 border-b border-bone/10 overflow-hidden">
      {/* Soft gold wash so the band reads as its own moment on the page. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-gold/[0.07] via-transparent to-transparent"
      />
      <div className="relative mx-auto max-w-[1400px] text-center">
        <Reveal>
          <span className="eyebrow text-gold text-[11px]">{EYEBROW}</span>
        </Reveal>
        <Reveal delay={0.1}>
          <h2
            className="font-display uppercase text-bone mt-4
                       text-[clamp(2.25rem,8.5vw,6.5rem)] leading-[0.95] tracking-tight"
          >
            {HEADLINE}
          </h2>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="font-serif italic text-bone-dim text-base sm:text-lg lg:text-xl mt-6 max-w-2xl mx-auto leading-relaxed">
            {SUBLINE}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
