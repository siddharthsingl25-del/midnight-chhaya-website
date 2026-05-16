"use client";

/**
 * Hero background — a single moody photograph, heavily darkened and
 * desaturated, with a very slow Ken-Burns drift.
 *
 * Pinterest-gothic moodboard: photography is the atmosphere; UI just sits
 * over it. The Picsum URL is a placeholder — replace `HERO_IMAGE` with
 * /public/brand/hero.jpg (or wherever) when real art direction lands.
 *
 * Heavy CSS filter + dark vignette guarantee the image always reads as
 * moody, regardless of whatever Picsum happens to serve from that seed.
 */

import Image from "next/image";
import { motion } from "framer-motion";

/* Swap this for `/brand/hero.jpg` once the real hero photograph is shot.
 * The grayscale + dark vignette below will keep any image looking gothic. */
const HERO_IMAGE =
  "https://picsum.photos/seed/midnight-chhaya-hero-01/2000/1200";

export default function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Slow inhale/exhale scale — 28 seconds end-to-end, alternates direction. */}
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.12 }}
        animate={{ scale: 1.02 }}
        transition={{
          duration: 28,
          ease: "linear",
          repeat: Infinity,
          repeatType: "reverse",
        }}
      >
        <Image
          src={HERO_IMAGE}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover grayscale contrast-[1.05] brightness-[0.45]"
        />
      </motion.div>

      {/* Heavy dark wash — strongest at edges and bottom, lighter centre so the
       * image registers as a backdrop rather than a focal point. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 50% 50%, rgba(10,10,10,0.45) 0%, rgba(10,10,10,0.78) 60%, rgba(10,10,10,0.95) 100%)",
        }}
      />

      {/* Bottom blend into the body's ink, so the section dissolves into
       * whatever comes next. */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-40
                   bg-gradient-to-b from-transparent to-ink"
      />
    </div>
  );
}
