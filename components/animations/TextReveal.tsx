"use client";

/**
 * Letter-by-letter (or word-by-word) reveal with blur-to-sharp transition.
 * Slow + cinematic by default; pass `as` to wrap in a heading element.
 */

import { motion } from "framer-motion";
import {
  letterReveal,
  staggerContainer,
  stagger,
  easeCinematic,
  durations,
} from "@/lib/animations";

type Props = {
  text: string;
  by?: "letter" | "word";
  delay?: number;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
  /** Animate on mount (true) or only when in viewport. */
  triggerOnView?: boolean;
};

export default function TextReveal({
  text,
  by = "letter",
  delay = 0,
  className = "",
  as = "span",
  triggerOnView = false,
}: Props) {
  const Tag = motion[as];
  const words = text.split(" ");
  const gap = by === "word" ? stagger.loose : stagger.tight;
  const duration = by === "word" ? durations.reveal : durations.heroReveal;

  return (
    <Tag
      className={className}
      variants={staggerContainer(delay, gap)}
      initial="hidden"
      {...(triggerOnView
        ? { whileInView: "visible", viewport: { once: true, amount: 0.4 } }
        : { animate: "visible" })}
      aria-label={text}
    >
      {words.map((word, wi) => (
        // Per-word wrapper keeps letters on the same line — without this
        // an inline-block letter chain breaks anywhere on narrow viewports.
        <span
          key={wi}
          className="inline-block whitespace-nowrap"
          aria-hidden
        >
          {by === "letter"
            ? Array.from(word).map((ch, i) => (
                <motion.span
                  key={i}
                  variants={letterReveal}
                  className="inline-block"
                  transition={{ duration, ease: easeCinematic }}
                >
                  {ch}
                </motion.span>
              ))
            : (
                <motion.span
                  variants={letterReveal}
                  className="inline-block"
                  transition={{ duration, ease: easeCinematic }}
                >
                  {word}
                </motion.span>
              )}
          {wi < words.length - 1 ? " " : ""}
        </span>
      ))}
    </Tag>
  );
}
