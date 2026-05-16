"use client";

/**
 * Brand teaser — two-column section.
 * Left: large atmospheric image with subtle parallax.
 * Right: editorial brand poetry, character-by-character reveal on scroll.
 */

import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import TextReveal from "@/components/animations/TextReveal";
import Reveal from "@/components/animations/Reveal";

const IMAGE = "https://picsum.photos/seed/mc-brand-teaser/1200/1500";

export default function BrandTeaser() {
  const ref = useRef<HTMLDivElement>(null);
  // image drifts upward at half the scroll speed while the section is in view
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ["8%", "-8%"]);

  return (
    <section
      ref={ref}
      className="relative px-6 md:px-10 py-28 md:py-40 bg-ink overflow-hidden"
    >
      <div className="mx-auto max-w-[1400px] grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-20 items-center">
        <div className="lg:col-span-6 relative">
          <Reveal scale={0.94} y={20}>
            <div className="relative aspect-[4/5] overflow-hidden bg-charcoal">
              <motion.div className="absolute inset-0 -top-[8%] -bottom-[8%]" style={{ y: imageY }}>
                <Image
                  src={IMAGE}
                  alt="A piece in progress, in candlelight"
                  fill
                  sizes="(min-width:1024px) 45vw, 90vw"
                  className="object-cover grayscale brightness-[0.7]"
                />
              </motion.div>
              {/* gold corner tick — small editorial detail */}
              <span className="absolute top-3 left-3 block h-6 w-px bg-gold/70" />
              <span className="absolute top-3 left-3 block h-px w-6 bg-gold/70" />
              <span className="absolute bottom-3 right-3 block h-6 w-px bg-gold/70" />
              <span className="absolute bottom-3 right-3 block h-px w-6 bg-gold/70" />
            </div>
          </Reveal>
        </div>

        <div className="lg:col-span-6 lg:pl-6">
          <Reveal>
            <span className="eyebrow">Atelier · Notes</span>
          </Reveal>
          <TextReveal
            as="h2"
            text="We work after sundown."
            by="word"
            triggerOnView
            className="mt-6 font-display text-bone uppercase
                       text-[clamp(2rem,5.5vw,4rem)] leading-[1.05]"
          />
          <Reveal delay={0.15}>
            <div className="mt-8 space-y-6 font-serif text-bone-dim text-lg leading-relaxed max-w-xl">
              <p>
                Each piece is forged, filed and finished by hand — slow work, quiet
                hours, a single warm bulb above the bench. We let the silver
                oxidise on its own time and we polish only the high points.
              </p>
              <p>
                Nothing is mass-cast. Nothing is identical. Wear something that
                remembers being made.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
