/**
 * Animation presets for Midnight Chhaya.
 *
 * The brand voice is restrained and deliberate — slow, heavy, cinematic.
 * Default to long durations (0.8s–1.4s) and ease curves that decelerate
 * gently. Never bouncy.
 *
 * Tweak these centrally; every component pulls from this file.
 */

import type { Easing, Transition, Variants } from "framer-motion";

/** Primary cinematic ease-out — used by ~90% of reveals. */
export const easeCinematic: Easing = [0.22, 1, 0.36, 1];

/** Slow ease-in-out for ambient drifts (background parallax, fog). */
export const easeAmbient: Easing = [0.65, 0, 0.35, 1];

/** Snappier ease for hover micro-interactions only. */
export const easeHover: Easing = [0.4, 0, 0.2, 1];

export const durations = {
  hover: 0.4,
  reveal: 1.0,
  heroReveal: 1.4,
  pageTransition: 0.8,
} as const;

/** Stagger time between siblings for cascading reveals. */
export const stagger: { tight: number; default: number; loose: number } = {
  tight: 0.04,
  default: 0.08,
  loose: 0.14,
};

/* ---------- Framer Motion variants ---------- */

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.reveal, ease: easeCinematic },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: durations.reveal, ease: easeCinematic },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: durations.reveal, ease: easeCinematic },
  },
};

/** Container for staggered children. */
export const staggerContainer = (delay = 0, gap = stagger.default): Variants => ({
  hidden: {},
  visible: {
    transition: { delayChildren: delay, staggerChildren: gap },
  },
});

/** Letter-by-letter reveal with subtle blur — used for headlines. */
export const letterReveal: Variants = {
  hidden: { opacity: 0, y: "0.5em", filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: durations.heroReveal, ease: easeCinematic },
  },
};

/** Default page transition for AnimatePresence. */
export const pageTransition: Transition = {
  duration: durations.pageTransition,
  ease: easeCinematic,
};
