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
  const tokens = by === "word" ? text.split(" ") : Array.from(text);
  const Tag = motion[as];

  return (
    <Tag
      className={className}
      variants={staggerContainer(delay, by === "word" ? stagger.loose : stagger.tight)}
      initial="hidden"
      {...(triggerOnView
        ? { whileInView: "visible", viewport: { once: true, amount: 0.4 } }
        : { animate: "visible" })}
      aria-label={text}
    >
      {tokens.map((token, i) => (
        <motion.span
          key={i}
          variants={letterReveal}
          aria-hidden
          className="inline-block whitespace-pre"
          // override letter duration for word mode (longer feels right)
          transition={{
            duration: by === "word" ? durations.reveal : durations.heroReveal,
            ease: easeCinematic,
          }}
        >
          {token}
          {by === "word" && i < tokens.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </Tag>
  );
}
