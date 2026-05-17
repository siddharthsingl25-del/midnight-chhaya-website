import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/sections/PageHeader";
import ProductCard from "@/components/ui/ProductCard";
import Reveal from "@/components/animations/Reveal";
import Footer from "@/components/ui/Footer";
import { exclusiveProducts } from "@/data/products";

export const metadata: Metadata = {
  title: "Exclusives",
  description:
    "One-of-one pieces and limited drops — made once, sold once.",
};

export default function ExclusivesPage() {
  const items = exclusiveProducts();

  return (
    <>
      <PageHeader
        eyebrow="Limited"
        title="One-of-one pieces."
        lede="Made in a single edition. When they are gone, they are gone. Inquire on Instagram to acquire."
      />

      <section className="px-6 md:px-10 pb-32">
        <div className="mx-auto max-w-[1400px]">
          {items.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 md:gap-x-10 gap-y-16">
              {items.map((p, i) => (
                <Reveal key={p.slug} delay={i * 0.08} y={36}>
                  <ProductCard product={p} priority={i < 2} />
                </Reveal>
              ))}
            </div>
          ) : (
            <p className="font-serif italic text-bone-dim text-center py-32">
              No exclusive pieces available right now. Follow us on Instagram
              for next drops.
            </p>
          )}

          <div className="mt-24 text-center">
            <Link
              href="/collections"
              data-cursor="See all"
              className="eyebrow text-gold gold-underline"
            >
              ← Back to all pieces
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
