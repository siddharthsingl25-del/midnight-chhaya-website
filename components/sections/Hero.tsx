"use client";

/**
 * Hero — gothic on pure black. Logo + atmosphere only.
 *
 * The eyebrow, gold flourish, and italic tagline that used to live under
 * the logo are gone; the CategoryTiles section below the hero now carries
 * the "what can I buy" cue instead. Keeps the drifting ash + droplets
 * atmosphere for mood.
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
    <section className="relative h-[80svh] min-h-[520px] w-full overflow-hidden">
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
        {/* Logo as the hero mark. Same glow + shimmer + bounce as before. */}
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
              <span
                className="logo-shimmer"
                style={{ "--logo-src": `url(${SITE.logoPath})` } as React.CSSProperties}
                aria-hidden
              />
            </motion.div>
          </span>
        </h1>
      </div>
    </section>
  );
}
