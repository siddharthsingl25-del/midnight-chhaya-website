"use client";

/**
 * Pinterest-style masonry gallery for /lookbook.
 *
 * Uses CSS columns so items naturally pack into a staggered grid based on
 * intrinsic image height. Each tile has a slight parallax — image inside
 * drifts at half the scroll speed for editorial depth.
 *
 * Click → opens shared Lightbox.
 */

import { useRef, useState } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { easeCinematic } from "@/lib/animations";
import Lightbox from "./Lightbox";
import { LOOKBOOK, type LookbookImage } from "@/data/lookbook";

export default function LookbookMasonry() {
  const [active, setActive] = useState<number | null>(null);

  const onOpen = (i: number) => setActive(i);
  const onClose = () => setActive(null);
  const onPrev = () =>
    setActive((i) => (i === null ? null : (i - 1 + LOOKBOOK.length) % LOOKBOOK.length));
  const onNext = () =>
    setActive((i) => (i === null ? null : (i + 1) % LOOKBOOK.length));

  return (
    <section className="px-6 md:px-10 pb-32">
      <div className="mx-auto max-w-[1500px]">
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 md:gap-8 [column-fill:_balance]">
          {LOOKBOOK.map((img, i) => (
            <Tile key={img.id} img={img} index={i} onOpen={onOpen} />
          ))}
        </div>
      </div>

      <Lightbox
        images={LOOKBOOK}
        index={active}
        onClose={onClose}
        onPrev={onPrev}
        onNext={onNext}
      />
    </section>
  );
}

function Tile({
  img,
  index,
  onOpen,
}: {
  img: LookbookImage;
  index: number;
  onOpen: (i: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  // image inside drifts opposite to scroll for parallax depth
  const y = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);

  return (
    <motion.figure
      ref={ref}
      initial={{ opacity: 0, y: 36, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 1.0, ease: easeCinematic, delay: (index % 6) * 0.04 }}
      className="mb-6 md:mb-8 break-inside-avoid"
    >
      <button
        type="button"
        onClick={() => onOpen(index)}
        data-cursor="View"
        className="group relative block w-full overflow-hidden bg-charcoal"
        style={{ aspectRatio: `1 / ${img.ratio}` }}
        aria-label={img.alt}
      >
        <motion.div className="absolute inset-0 -top-[6%] -bottom-[6%]" style={{ y }}>
          <Image
            src={img.src}
            alt={img.alt}
            fill
            sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
            className="object-cover grayscale-[0.35] brightness-[0.82]
                       transition-[transform,filter] duration-[1.4s] ease-[cubic-bezier(0.22,1,0.36,1)]
                       group-hover:scale-[1.04] group-hover:grayscale-0 group-hover:brightness-100"
          />
        </motion.div>
        {/* gold tick top-left */}
        <span className="absolute top-2 left-2 block h-4 w-px bg-gold/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <span className="absolute top-2 left-2 block h-px w-4 bg-gold/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </button>
    </motion.figure>
  );
}
