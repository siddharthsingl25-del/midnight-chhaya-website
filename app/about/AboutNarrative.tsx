"use client";

/**
 * About narrative — vertical scroll story.
 *
 * Each "beat" is a full-viewport pinned section. While the user scrolls,
 * the atmospheric image stays fixed (sticky) on one side and the text
 * scrubs past on the other. Crossfade between beats handled by individual
 * sticky scroll-linked opacities.
 *
 * Implementation note: `position: sticky` on the visual side gives us the
 * pinned feel without ScrollTrigger. Framer's useScroll handles the
 * per-beat opacity scrubbing.
 */

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import TextReveal from "@/components/animations/TextReveal";
import Reveal from "@/components/animations/Reveal";
import { STORY } from "@/data/about";

export default function AboutNarrative() {
  return (
    <section className="px-6 md:px-10">
      <div className="mx-auto max-w-[1400px]">
        {STORY.map((beat, i) => (
          <Beat key={i} beat={beat} flip={i % 2 === 1} index={i} />
        ))}
      </div>
    </section>
  );
}

function Beat({
  beat,
  flip,
  index,
}: {
  beat: (typeof STORY)[number];
  flip: boolean;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // image stays mostly visible, dimming slightly at the ends to crossfade
  // with the next beat. Kept subtle — this is atmosphere, not a slideshow.
  const imageOpacity: MotionValue<number> = useTransform(
    scrollYProgress,
    [0, 0.2, 0.8, 1],
    [0.4, 1, 1, 0.4]
  );
  const imageScale = useTransform(scrollYProgress, [0, 1], [1.08, 0.96]);

  return (
    <article
      ref={ref}
      className={[
        "grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-20 items-start",
        "min-h-[140vh] py-24",
      ].join(" ")}
    >
      {/* Visual — pinned via sticky */}
      <div
        className={[
          "lg:col-span-6",
          flip ? "lg:col-start-7 lg:row-start-1" : "lg:col-start-1",
        ].join(" ")}
      >
        <div className="sticky top-32">
          <motion.div
            style={{ opacity: imageOpacity, scale: imageScale }}
            className="relative aspect-[4/5] overflow-hidden bg-charcoal"
          >
            <Image
              src={beat.image}
              alt=""
              fill
              priority={index === 0}
              sizes="(min-width:1024px) 45vw, 90vw"
              className="object-cover grayscale brightness-[0.65]"
            />
            <span className="absolute top-3 left-3 block h-6 w-px bg-gold/70" />
            <span className="absolute top-3 left-3 block h-px w-6 bg-gold/70" />
          </motion.div>
        </div>
      </div>

      {/* Text */}
      <div
        className={[
          "lg:col-span-6",
          flip ? "lg:col-start-1 lg:row-start-1" : "lg:col-start-7",
          "flex flex-col gap-6 lg:pt-20",
        ].join(" ")}
      >
        <Reveal>
          <span className="eyebrow">{beat.eyebrow}</span>
        </Reveal>
        <TextReveal
          as="h2"
          text={beat.heading}
          by="word"
          triggerOnView
          className="font-display text-bone uppercase
                     text-[clamp(2rem,5.5vw,4rem)] leading-[1.05] max-w-xl"
        />
        <Reveal delay={0.15}>
          <p className="font-serif text-bone-dim text-lg leading-relaxed max-w-xl">
            {beat.body}
          </p>
        </Reveal>
      </div>
    </article>
  );
}
