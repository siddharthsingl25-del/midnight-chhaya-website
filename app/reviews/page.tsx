/**
 * /reviews — public gallery of customer review screenshots.
 *
 * Server-rendered with a short cache TTL. The merchant uploads
 * screenshots via admin → Reviews → they show up here in a grid.
 */

import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import Footer from "@/components/ui/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reviews",
  description: "What our customers say about Midnight Chhaya.",
};

type ReviewRow = {
  id: number;
  image_url: string;
};

const getReviews = unstable_cache(
  async (): Promise<ReviewRow[]> => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
    if (!url || !key) return [];
    const sb = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await sb
      .from("reviews")
      .select("id, image_url")
      .order("display_order", { ascending: true })
      .order("id", { ascending: false });
    if (error || !data) return [];
    return data as ReviewRow[];
  },
  ["all-reviews"],
  { tags: ["reviews"], revalidate: 60 }
);

export default async function ReviewsPage() {
  const reviews = await getReviews();

  return (
    <>
      <section className="px-6 md:px-10 pt-32 md:pt-40 pb-16 md:pb-24">
        <div className="mx-auto max-w-[1400px]">
          <span className="eyebrow text-bone-dim">Kind words</span>
          <h1 className="font-display uppercase text-bone text-[clamp(2.5rem,6vw,5rem)] leading-[1.02] mt-3">
            Reviews.
          </h1>
          <p className="font-serif italic text-bone-dim text-base sm:text-lg max-w-xl mt-4">
            Every message, every tag, every thank-you — kept.
          </p>
        </div>
      </section>

      <section className="px-6 md:px-10 pb-32">
        <div className="mx-auto max-w-[1400px]">
          {reviews.length === 0 ? (
            <p className="font-serif italic text-bone-dim text-lg">
              Reviews arriving soon.
            </p>
          ) : (
            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {reviews.map((r) => (
                <li
                  key={r.id}
                  className="relative aspect-[3/4] bg-charcoal overflow-hidden border border-bone/5"
                >
                  <Image
                    src={r.image_url}
                    alt="Customer review"
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                    className="object-cover"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
