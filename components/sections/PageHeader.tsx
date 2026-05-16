"use client";

/**
 * Page header — used at the top of every non-home route.
 * Sits below the fixed site header (pt-32). Big editorial title.
 */

import TextReveal from "@/components/animations/TextReveal";
import Reveal from "@/components/animations/Reveal";

export default function PageHeader({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
}) {
  return (
    <header className="px-6 md:px-10 pt-40 pb-16 md:pt-48 md:pb-24">
      <div className="mx-auto max-w-[1400px] flex flex-col gap-6">
        <Reveal>
          <span className="eyebrow">{eyebrow}</span>
        </Reveal>
        <TextReveal
          as="h1"
          text={title}
          by="word"
          delay={0.1}
          className="font-display text-bone uppercase text-[clamp(2.5rem,9vw,6rem)] leading-[1.02]"
        />
        {lede ? (
          <Reveal delay={0.25}>
            <p className="font-serif italic text-bone-dim text-lg sm:text-xl max-w-2xl leading-relaxed">
              {lede}
            </p>
          </Reveal>
        ) : null}
        <Reveal delay={0.35}>
          <span className="block h-px w-24 bg-gold/60 mt-6" />
        </Reveal>
      </div>
    </header>
  );
}
