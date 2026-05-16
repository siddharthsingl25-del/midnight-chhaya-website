"use client";

/**
 * Lookbook preview — 4-image asymmetric Pinterest-style collage that links
 * to the full /lookbook. CSS-grid based with deliberate vertical offsets.
 */

import Link from "next/link";
import Image from "next/image";
import SectionHeading from "@/components/ui/SectionHeading";
import Reveal from "@/components/animations/Reveal";
import { LOOKBOOK_PREVIEW } from "@/data/lookbook";

export default function LookbookPreview() {
  return (
    <section className="relative px-6 md:px-10 py-28 md:py-40">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16 md:mb-24">
          <SectionHeading eyebrow="Lookbook" title="Worn in shadow." />
          <Reveal delay={0.2}>
            <Link
              href="/lookbook"
              data-cursor="Open lookbook"
              className="eyebrow text-gold gold-underline inline-block"
            >
              See the full lookbook →
            </Link>
          </Reveal>
        </div>

        {/* asymmetric 12-column collage on desktop, 2-col mosaic on tablet, single column on phone */}
        <div className="grid grid-cols-2 lg:grid-cols-12 gap-4 md:gap-6">
          <Reveal className="lg:col-span-5 lg:col-start-1 lg:row-start-1 lg:translate-y-12" amount={0.1}>
            <LookFrame img={LOOKBOOK_PREVIEW[0]} aspect="aspect-[3/4]" />
          </Reveal>
          <Reveal delay={0.08} className="lg:col-span-4 lg:col-start-7 lg:row-start-1" amount={0.1}>
            <LookFrame img={LOOKBOOK_PREVIEW[1]} aspect="aspect-square" />
          </Reveal>
          <Reveal delay={0.16} className="lg:col-span-3 lg:col-start-3 lg:row-start-2 lg:translate-y-24" amount={0.1}>
            <LookFrame img={LOOKBOOK_PREVIEW[2]} aspect="aspect-[3/4]" />
          </Reveal>
          <Reveal delay={0.24} className="lg:col-span-5 lg:col-start-7 lg:row-start-2 lg:translate-y-8" amount={0.1}>
            <LookFrame img={LOOKBOOK_PREVIEW[3]} aspect="aspect-[4/5]" />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function LookFrame({
  img,
  aspect,
}: {
  img: { src: string; alt: string };
  aspect: string;
}) {
  return (
    <figure className={`relative w-full ${aspect} overflow-hidden bg-charcoal group`}>
      <Image
        src={img.src}
        alt={img.alt}
        fill
        sizes="(min-width:1024px) 35vw, 90vw"
        className="object-cover grayscale-[0.4] brightness-[0.78] transition-[transform,filter] duration-[1.4s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04] group-hover:grayscale-0 group-hover:brightness-100"
      />
    </figure>
  );
}
