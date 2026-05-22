"use client";

/**
 * About — single editorial block. Image on the left, founder's note on
 * the right. Replaced the previous 5-beat scroll narrative with one
 * focused screen so the page is read in seconds, not scrolled through.
 */

import Image from "next/image";
import TextReveal from "@/components/animations/TextReveal";
import Reveal from "@/components/animations/Reveal";

const IMAGE = "/brand/atelier-pieces.webp";

export default function AboutNarrative() {
  return (
    <section className="px-6 md:px-10 pb-32">
      <div className="mx-auto max-w-[1400px]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-20 items-start">
          {/* Visual */}
          <Reveal scale={0.96} y={20} className="lg:col-span-6">
            <div className="relative aspect-[4/5] overflow-hidden bg-charcoal">
              <Image
                src={IMAGE}
                alt="Midnight Chhaya pieces laid in a circle"
                fill
                priority
                sizes="(min-width:1024px) 45vw, 90vw"
                className="object-cover brightness-[0.85]"
              />
              <span className="absolute top-3 left-3 block h-6 w-px bg-gold/70" />
              <span className="absolute top-3 left-3 block h-px w-6 bg-gold/70" />
              <span className="absolute bottom-3 right-3 block h-6 w-px bg-gold/70" />
              <span className="absolute bottom-3 right-3 block h-px w-6 bg-gold/70" />
            </div>
          </Reveal>

          {/* Text */}
          <div className="lg:col-span-6 flex flex-col gap-6 lg:pt-10">
            <Reveal>
              <span className="eyebrow">Maker</span>
            </Reveal>
            <TextReveal
              as="h2"
              text="Sixteen, and stubborn."
              by="word"
              triggerOnView
              className="font-display text-bone uppercase
                         text-[clamp(2rem,5.5vw,4rem)] leading-[1.05] max-w-xl"
            />
            <Reveal delay={0.15}>
              <div className="font-serif text-bone-dim text-lg leading-relaxed max-w-xl flex flex-col gap-5">
                <p>
                  My name is <strong className="text-bone font-semibold not-italic">Siddharth Singla</strong>. I am sixteen, and Midnight Chhaya is the first thing I have built end-to-end. It started in the back of school notebooks — sketches I could not stand to leave flat on paper. So I taught myself how to make them.
                </p>
                <p>
                  Every piece is forged, filed and finished by hand — slow work, quiet hours, small batches. Nothing is mass-cast. Ideas arrive faster than I can finish the last batch, which is why a piece you buy today is rarely repeated.
                </p>
                <p>
                  I started this because I wanted to actually serve someone — not as a brand exercise, but to put something real on a real shoulder. If you are wearing something of mine, thank you. You are wearing the notebook.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
