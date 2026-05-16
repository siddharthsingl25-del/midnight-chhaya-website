"use client";

/**
 * Hero — editorial / Pinterest-gothic.
 *
 *  - Moody darkened photograph as backdrop (slow Ken-Burns)
 *  - Eyebrow → headline (letter reveal) → gold flourish → tagline (word reveal)
 *  - Scroll cue at the bottom
 *
 * Sequencing is intentionally slow (~3.5s end-to-end) — gothic reads as
 * restrained, not energetic.
 */

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import HeroBackground from "./HeroBackground";
import TextReveal from "@/components/animations/TextReveal";
import { easeCinematic, durations } from "@/lib/animations";
import { SITE } from "@/lib/site";

export default function Hero() {
  return (
    <section className="relative h-[100svh] min-h-[640px] w-full overflow-hidden">
      {/* photographic backdrop fades in slightly slower than text appears */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2.4, ease: easeCinematic, delay: 0.1 }}
        className="absolute inset-0"
      >
        <HeroBackground />
      </motion.div>

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: durations.reveal, ease: easeCinematic, delay: 0.6 }}
          className="eyebrow mb-8"
        >
          Volume I · MMXXVI
        </motion.span>

        <TextReveal
          as="h1"
          text={SITE.name}
          by="letter"
          delay={0.9}
          className="font-display text-[clamp(2.5rem,11vw,8rem)] leading-[1.05] text-bone uppercase max-w-[92vw]"
        />

        {/* Victorian flourish — thin gold lines with a centred lozenge.
         * Each piece grows out from the centre to its width. */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, ease: easeCinematic, delay: 2.0 }}
          className="my-8 flex items-center gap-3"
        >
          <motion.span
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.4, ease: easeCinematic, delay: 2.0 }}
            className="block h-px w-16 origin-right bg-gold/60"
          />
          <motion.span
            initial={{ scale: 0, rotate: 0 }}
            animate={{ scale: 1, rotate: 45 }}
            transition={{ duration: 0.9, ease: easeCinematic, delay: 2.4 }}
            className="block h-1.5 w-1.5 bg-gold"
          />
          <motion.span
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.4, ease: easeCinematic, delay: 2.0 }}
            className="block h-px w-16 origin-left bg-gold/60"
          />
        </motion.div>

        <TextReveal
          as="p"
          text={SITE.tagline}
          by="word"
          delay={2.6}
          className="font-serif italic text-bone-dim text-lg sm:text-xl md:text-2xl tracking-wide max-w-[92vw]"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: easeCinematic, delay: 3.2 }}
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
    </section>
  );
}
