"use client";

/**
 * Generic scroll-triggered reveal — fade + slight rise (or fade + scale).
 * Default amount is 0.2 (fires when 20% of the element is in view).
 *
 * Use this anywhere you want "fade up on scroll" without writing variants.
 */

import { motion, type Variants } from "framer-motion";
import { easeCinematic, durations } from "@/lib/animations";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** y offset in px to rise from. */
  y?: number;
  /** initial scale (0–1). 1 disables the scale animation. */
  scale?: number;
  /** viewport.amount — fraction of element visible before triggering. */
  amount?: number;
  as?: "div" | "section" | "article" | "li" | "figure" | "span";
  duration?: number;
};

export default function Reveal({
  children,
  className,
  delay = 0,
  y = 32,
  scale = 1,
  amount = 0.2,
  as = "div",
  duration = durations.reveal,
}: Props) {
  const Tag = motion[as];

  const variants: Variants = {
    hidden: { opacity: 0, y, scale },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration, ease: easeCinematic, delay },
    },
  };

  return (
    <Tag
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
    >
      {children}
    </Tag>
  );
}
