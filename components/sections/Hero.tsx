"use client";

/**
 * Hero — gothic on pure black.
 *
 *  - No photographic backdrop. The body's deep-ink fill carries through.
 *  - HeroAtmosphere overlay: drifting white ash + falling water droplets
 *  - "Ghost" reveal for the logo: snaps into existence with a brief
 *    bright/blurred flash, then continues to glow and gently hop
 *  - Eyebrow + Victorian gold flourish + italic tagline fade in around it
 */

import dynamic from "next/dynamic";
import Image from "next/image";
import { motion } from "framer-motion";
import { easeCinematic } from "@/lib/animations";
import { SITE } from "@/lib/site";

// R3F + CSS droplets — client-only (ssr:false must live in a client component in Next 16)
const HeroAtmosphere = dynamic(() => import("@/components/three/HeroAtmosphere"), {
  ssr: false,
  loading: () => null,
});

export default function Hero() {
  return (
    <section className="relative h-[100svh] min-h-[640px] w-full overflow-hidden">
      {/* ash + droplets only — no photo */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.6, ease: easeCinematic, delay: 0.4 }}
        className="absolute inset-0"
      >
        <HeroAtmosphere />
      </motion.div>

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easeCinematic }}
          className="eyebrow mb-8"
        >
          Volume I · MMXXVI
        </motion.span>

        {/* Logo as the hero mark — paints instantly on first frame.
         *   1. logo-glow    — pulsing warm halo, loops (CSS)
         *   2. logo-shimmer — diagonal metallic sweep masked to letterforms (CSS)
         *   3. y-bounce     — gentle continuous "hop" via framer-motion */}
        <h1 className="m-0">
          <span className="sr-only">{SITE.name}</span>
          <span className="block">
            <motion.div
              className="relative inline-block"
              initial={{ y: 0 }}
              animate={{ y: [0, -14, 0] }}
              transition={{
                duration: 3.6,
                ease: "easeInOut",
                repeat: Infinity,
              }}
            >
              <Image
                src={SITE.logoPath}
                alt={SITE.name}
                width={776}
                height={321}
                priority
                className="logo-glow block h-auto w-[clamp(380px,86vw,1100px)] mx-auto select-none"
              />
              {/* metallic shimmer sweep — masked to the logo's alpha channel.
               * --logo-src is the same file the <Image> renders; CSS reads it
               * via mask-image so light only paints the letterforms. */}
              <span
                className="logo-shimmer"
                style={{ "--logo-src": `url(${SITE.logoPath})` } as React.CSSProperties}
                aria-hidden
              />
            </motion.div>
          </span>
        </h1>

        {/* Victorian flourish */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: easeCinematic, delay: 0.2 }}
          className="my-8 flex items-center gap-3"
        >
          <motion.span
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.7, ease: easeCinematic, delay: 0.2 }}
            className="block h-px w-16 origin-right bg-gold/60"
          />
          <motion.span
            initial={{ scale: 0, rotate: 0 }}
            animate={{ scale: 1, rotate: 45 }}
            transition={{ duration: 0.5, ease: easeCinematic, delay: 0.4 }}
            className="block h-1.5 w-1.5 bg-gold"
          />
          <motion.span
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.7, ease: easeCinematic, delay: 0.2 }}
            className="block h-px w-16 origin-left bg-gold/60"
          />
        </motion.div>

        {/* Tagline — short fade for thematic consistency */}
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: easeCinematic, delay: 0.3 }}
          className="font-serif italic text-bone-dim text-lg sm:text-xl md:text-2xl tracking-wide max-w-[92vw]"
        >
          {SITE.tagline}
        </motion.p>
      </div>
    </section>
  );
}
