"use client";

/**
 * Hero — full-viewport.
 *  - R3F particle field (lazy-loaded, no SSR) for performance
 *  - Big gothic display headline with letter-by-letter blur-to-sharp reveal
 *  - Tagline + scroll indicator
 *  - Sequencing: scene fades up first, then headline letters cascade, then tagline + cue
 */

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import TextReveal from "@/components/animations/TextReveal";
import { easeCinematic, durations } from "@/lib/animations";
import { SITE } from "@/lib/site";

// R3F needs window — disable SSR. ssr:false must live inside a Client Component (Next 16).
const HeroScene = dynamic(() => import("@/components/three/HeroScene"), {
  ssr: false,
  loading: () => null,
});

export default function Hero() {
  return (
    <section className="relative h-[100svh] min-h-[640px] w-full overflow-hidden">
      {/* 3D ember field */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2.2, ease: easeCinematic, delay: 0.1 }}
        className="absolute inset-0"
      >
        <HeroScene />
      </motion.div>

      {/* Headline content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: durations.reveal, ease: easeCinematic, delay: 0.6 }}
          className="eyebrow mb-8"
        >
          Est. in shadow
        </motion.span>

        <TextReveal
          as="h1"
          text={SITE.name}
          by="letter"
          delay={0.9}
          className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-[8.5rem] leading-[1.05] text-bone uppercase"
        />

        {/* divider — animates in after headline */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 1.4, ease: easeCinematic, delay: 2.0 }}
          className="my-8 h-px w-24 origin-center bg-gold/60"
        />

        <TextReveal
          as="p"
          text={SITE.tagline}
          by="word"
          delay={2.3}
          className="font-serif italic text-bone-dim text-lg sm:text-xl md:text-2xl tracking-wide"
        />
      </div>

      {/* scroll cue */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: easeCinematic, delay: 3.0 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-bone-dim"
      >
        <span className="eyebrow text-bone-dim">Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="h-4 w-4 text-gold" strokeWidth={1.5} />
        </motion.div>
      </motion.div>

      {/* bottom fade into next section */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-ink" />
    </section>
  );
}
