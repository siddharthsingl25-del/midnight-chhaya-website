"use client";

/**
 * Reusable section heading — eyebrow + display title + optional lede.
 * Reveals letter-by-letter on scroll.
 */

import TextReveal from "@/components/animations/TextReveal";
import Reveal from "@/components/animations/Reveal";

type Props = {
  eyebrow?: string;
  title: string;
  lede?: string;
  align?: "left" | "center";
  className?: string;
};

export default function SectionHeading({
  eyebrow,
  title,
  lede,
  align = "left",
  className = "",
}: Props) {
  const alignClass = align === "center" ? "text-center items-center" : "text-left items-start";
  return (
    <div className={`flex flex-col gap-5 ${alignClass} ${className}`}>
      {eyebrow ? (
        <Reveal>
          <span className="eyebrow">{eyebrow}</span>
        </Reveal>
      ) : null}
      <TextReveal
        as="h2"
        text={title}
        by="word"
        triggerOnView
        className="font-display text-bone uppercase
                   text-[clamp(2rem,6vw,4.5rem)] leading-[1.05] max-w-4xl"
      />
      {lede ? (
        <Reveal delay={0.1}>
          <p
            className={`font-serif italic text-bone-dim text-lg sm:text-xl leading-relaxed max-w-2xl ${
              align === "center" ? "mx-auto" : ""
            }`}
          >
            {lede}
          </p>
        </Reveal>
      ) : null}
    </div>
  );
}
