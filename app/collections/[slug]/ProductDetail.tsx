"use client";

/**
 * Product detail client component.
 * - Left: large image with subtle ken-burns zoom + thumbnail picker
 * - Right: editorial info block + "Inquire on Instagram" CTA (magnetic)
 * - Below: related pieces (sibling category)
 */

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { ArrowLeft, Check, Plus } from "lucide-react";
import InstagramIcon from "@/components/ui/icons/InstagramIcon";
import ProductCard from "@/components/ui/ProductCard";
import ChainSelector from "@/components/ui/ChainSelector";
import Reveal from "@/components/animations/Reveal";
import TextReveal from "@/components/animations/TextReveal";
import { useMagnetic } from "@/lib/useMagnetic";
import { easeCinematic } from "@/lib/animations";
import { formatPrice, SITE } from "@/lib/site";
import { useCart } from "@/lib/cart";
import { CHAIN_OPTIONS, chainById, hasChainOptions } from "@/data/chains";
import type { Product } from "@/data/products";

export default function ProductDetail({
  product,
  related,
}: {
  product: Product;
  related: Product[];
}) {
  const [active, setActive] = useState(0);
  const [justAdded, setJustAdded] = useState(false);
  const { add: addToCart } = useCart();
  const imageRef = useRef<HTMLDivElement>(null);

  /* Chain selector applies only to chains-category products, and only when
   * at least one chain option has been published in data/chains.ts. */
  const chainPicker =
    product.category === "chains" && hasChainOptions();
  const [chainId, setChainId] = useState<string | null>(
    chainPicker ? CHAIN_OPTIONS[0]?.id ?? null : null
  );
  const selectedChain = chainById(chainId);
  const displayedUnitPrice =
    product.price == null
      ? null
      : product.price + (selectedChain?.priceModifier ?? 0);
  const { scrollYProgress } = useScroll({
    target: imageRef,
    offset: ["start end", "end start"],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ["-3%", "3%"]);
  const { ref: magRef, x, y } = useMagnetic(12);

  const dmMessage = encodeURIComponent(
    `Hi Midnight Chhaya — I'd like to inquire about the ${product.name}.`
  );
  const dmHref = `${SITE.instagram}?ref=${product.slug}#${dmMessage}`;

  return (
    <article className="px-6 md:px-10 pt-32 pb-32">
      <div className="mx-auto max-w-[1400px]">
        <Reveal>
          <Link
            href="/collections"
            data-cursor="Back"
            className="inline-flex items-center gap-2 eyebrow text-bone-dim hover:text-gold transition-colors duration-500"
          >
            <ArrowLeft size={14} /> All pieces
          </Link>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-20">
          {/* left: image + thumbs */}
          <div className="lg:col-span-7">
            <Reveal scale={0.96} y={20} className="block">
              <div
                ref={imageRef}
                className="relative aspect-[4/5] overflow-hidden bg-charcoal"
              >
                <motion.div className="absolute inset-0 -top-[4%] -bottom-[4%]" style={{ y: imageY }}>
                  <Image
                    key={product.images[active]}
                    src={product.images[active]}
                    alt={product.name}
                    fill
                    priority
                    sizes="(min-width:1024px) 55vw, 90vw"
                    className="object-cover"
                  />
                </motion.div>
                {/* corner ticks */}
                <span className="absolute top-3 left-3 block h-6 w-px bg-gold/70" />
                <span className="absolute top-3 left-3 block h-px w-6 bg-gold/70" />
                <span className="absolute bottom-3 right-3 block h-6 w-px bg-gold/70" />
                <span className="absolute bottom-3 right-3 block h-px w-6 bg-gold/70" />
              </div>
            </Reveal>

            {product.images.length > 1 ? (
              <div className="mt-4 flex gap-3">
                {product.images.map((src, i) => (
                  <button
                    key={src}
                    onClick={() => setActive(i)}
                    aria-label={`Show image ${i + 1}`}
                    data-cursor="View"
                    className={[
                      "relative aspect-[4/5] w-20 overflow-hidden bg-charcoal transition-opacity duration-500",
                      i === active ? "ring-1 ring-gold opacity-100" : "opacity-60 hover:opacity-100",
                    ].join(" ")}
                  >
                    <Image
                      src={src}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {/* right: meta */}
          <div className="lg:col-span-5 lg:pt-6 flex flex-col gap-8">
            <Reveal>
              <span className="eyebrow">{product.category}</span>
            </Reveal>
            <TextReveal
              as="h1"
              text={product.name}
              by="word"
              delay={0.05}
              className="font-display text-bone uppercase text-[clamp(2rem,5vw,3.5rem)] leading-[1.05]"
            />
            <Reveal delay={0.15}>
              <p className="font-serif italic text-bone text-2xl">
                {formatPrice(displayedUnitPrice)}
              </p>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="font-serif text-bone-dim text-lg leading-relaxed">
                {product.description}
              </p>
            </Reveal>

            {chainPicker ? (
              <Reveal delay={0.25}>
                <ChainSelector value={chainId} onChange={setChainId} />
              </Reveal>
            ) : null}

            <Reveal delay={0.3}>
              <dl className="grid grid-cols-1 gap-y-4 mt-2 border-t border-bone/10 pt-6">
                <div className="flex items-start gap-6">
                  <dt className="eyebrow text-bone-dim min-w-[120px]">Materials</dt>
                  <dd className="font-body text-bone">{product.materials.join(", ")}</dd>
                </div>
                {product.dimensions ? (
                  <div className="flex items-start gap-6">
                    <dt className="eyebrow text-bone-dim min-w-[120px]">Dimensions</dt>
                    <dd className="font-body text-bone">{product.dimensions}</dd>
                  </div>
                ) : null}
                <div className="flex items-start gap-6">
                  <dt className="eyebrow text-bone-dim min-w-[120px]">Made</dt>
                  <dd className="font-body text-bone">By hand, in small batches</dd>
                </div>
              </dl>
            </Reveal>

            <Reveal delay={0.4}>
              <div className="flex flex-wrap items-stretch gap-3">
                {/* Add to cart — primary, filled gold */}
                <button
                  type="button"
                  onClick={() => {
                    addToCart(product.slug, {
                      chainId: chainPicker ? chainId ?? undefined : undefined,
                      qty: 1,
                    });
                    setJustAdded(true);
                    setTimeout(() => setJustAdded(false), 1800);
                  }}
                  data-cursor={justAdded ? "Added" : "Add to cart"}
                  className="group inline-flex items-center gap-3 px-8 py-4
                             bg-gold text-ink
                             transition-all duration-500
                             hover:shadow-[0_0_36px_-6px_rgba(184,147,90,0.6)]
                             disabled:opacity-70"
                >
                  {justAdded ? (
                    <>
                      <Check size={18} strokeWidth={1.75} />
                      <span className="eyebrow text-ink">Added to cart</span>
                    </>
                  ) : (
                    <>
                      <Plus size={18} strokeWidth={1.75} />
                      <span className="eyebrow text-ink">Add to cart</span>
                    </>
                  )}
                </button>

                {/* Inquire — secondary, outlined, magnetic */}
                <motion.div ref={magRef} style={{ x, y }} className="inline-block">
                  <a
                    href={dmHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-cursor="Inquire"
                    data-cursor-magnetic
                    className="group inline-flex items-center gap-3 px-8 py-4
                               border border-gold/60 text-gold h-full
                               transition-colors duration-500
                               hover:bg-gold hover:text-ink
                               hover:shadow-[0_0_36px_-6px_rgba(184,147,90,0.55)]"
                  >
                    <InstagramIcon size={18} />
                    <span className="eyebrow">Inquire on Instagram</span>
                  </a>
                </motion.div>
              </div>
            </Reveal>
          </div>
        </div>

        {/* related */}
        {related.length ? (
          <section className="mt-32 md:mt-44">
            <div className="flex items-end justify-between gap-6 mb-12">
              <h2 className="font-display uppercase text-bone text-2xl md:text-3xl">
                Related pieces
              </h2>
              <Link
                href="/collections"
                data-cursor="See all"
                className="eyebrow text-gold gold-underline"
              >
                See all →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 md:gap-x-10 gap-y-16">
              {related.map((p, i) => (
                <motion.div
                  key={p.slug}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.9, ease: easeCinematic, delay: i * 0.08 }}
                >
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </article>
  );
}
