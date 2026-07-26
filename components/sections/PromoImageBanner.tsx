"use client";

/**
 * Homepage promo banner (image only).
 *
 * Renders a single hero-width image between the Hero and the Pre-order
 * section. Auto-hides if no URL is set, so we don't ship a broken box.
 *
 * To swap the banner: edit HOMEPAGE_BANNER_URL in lib/site.ts.
 */

import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/animations/Reveal";
import { HOMEPAGE_BANNER } from "@/lib/site";

export default function PromoImageBanner() {
  if (!HOMEPAGE_BANNER.url) return null;

  const content = (
    <div className="relative w-full aspect-[1600/540] overflow-hidden bg-charcoal border-y border-bone/5">
      <Image
        src={HOMEPAGE_BANNER.url}
        alt={HOMEPAGE_BANNER.alt}
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
    </div>
  );

  if (HOMEPAGE_BANNER.href) {
    return (
      <section id="promo-banner" className="w-full">
        <Reveal>
          <Link href={HOMEPAGE_BANNER.href} data-cursor="Shop">
            {content}
          </Link>
        </Reveal>
      </section>
    );
  }

  return (
    <section id="promo-banner" className="w-full">
      <Reveal>{content}</Reveal>
    </section>
  );
}
