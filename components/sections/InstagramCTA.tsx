"use client";

/**
 * Instagram CTA — full-bleed dark band inviting visitors to follow.
 * Magnetic primary button at the centre.
 */

import { motion } from "framer-motion";
import { useMagnetic } from "@/lib/useMagnetic";
import InstagramIcon from "@/components/ui/icons/InstagramIcon";
import TextReveal from "@/components/animations/TextReveal";
import Reveal from "@/components/animations/Reveal";
import { SITE } from "@/lib/site";

export default function InstagramCTA() {
  const { ref, x, y } = useMagnetic(14);

  return (
    <section className="relative px-6 md:px-10 py-28 md:py-40 overflow-hidden border-y border-bone/5">
      {/* faint warm wash for atmosphere */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(184,147,90,0.07), transparent 70%)",
        }}
      />
      <div className="relative mx-auto max-w-3xl text-center flex flex-col items-center gap-10">
        <Reveal>
          <span className="eyebrow">{SITE.instagramHandle}</span>
        </Reveal>
        <TextReveal
          as="h2"
          text="Follow our story."
          by="word"
          triggerOnView
          className="font-display text-bone uppercase text-[clamp(2rem,6vw,4.5rem)] leading-[1.05]"
        />
        <Reveal delay={0.15}>
          <p className="font-serif italic text-bone-dim text-lg max-w-xl">
            Process notes, candle-lit stills, new pieces before they reach the
            site. Best read after dark.
          </p>
        </Reveal>

        <Reveal delay={0.25}>
          <motion.div ref={ref} style={{ x, y }} className="inline-block">
            <a
              href={SITE.instagram}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="Open"
              data-cursor-magnetic
              className="group inline-flex items-center gap-4 px-8 py-4
                         border border-gold/60 text-gold
                         transition-colors duration-500
                         hover:bg-gold hover:text-ink
                         hover:shadow-[0_0_40px_-6px_rgba(184,147,90,0.55)]"
            >
              <InstagramIcon size={20} />
              <span className="eyebrow">Follow on Instagram</span>
            </a>
          </motion.div>
        </Reveal>
      </div>
    </section>
  );
}
