import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/sections/PageHeader";
import Footer from "@/components/ui/Footer";
import InquiryForm from "./InquiryForm";
import InstagramButton from "@/components/ui/InstagramButton";
import Reveal from "@/components/animations/Reveal";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Inquire about a piece, request a commission, or just say hello.",
};

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Inquire"
        title="Write to us."
        lede="For commissions, custom pieces, or questions about what's available. We answer by hand."
      />

      <section className="px-6 md:px-10 pb-32">
        <div className="mx-auto max-w-[1400px] grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          <div className="lg:col-span-7">
            <InquiryForm />
          </div>

          <aside className="lg:col-span-5 flex flex-col gap-10 lg:pt-12 lg:border-l lg:border-bone/10 lg:pl-12">
            <Reveal>
              <div>
                <span className="eyebrow block mb-3">Direct</span>
                <Link
                  href={`mailto:${SITE.email}`}
                  data-cursor="Write us"
                  className="font-display text-bone text-xl gold-underline inline-block"
                >
                  {SITE.email}
                </Link>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div>
                <span className="eyebrow block mb-3">Faster</span>
                <p className="font-serif italic text-bone-dim text-lg leading-relaxed max-w-sm mb-5">
                  Instagram is where the new pieces appear first. DMs are
                  usually answered within a day.
                </p>
                <InstagramButton variant="label" label={SITE.instagramHandle} />
              </div>
            </Reveal>

            <Reveal delay={0.2}>
              <div>
                <span className="eyebrow block mb-3">Hours</span>
                <p className="font-serif text-bone-dim text-lg leading-relaxed max-w-sm">
                  We are mostly at the bench between sundown and 2&nbsp;a.m.
                  IST. Replies tend to arrive in those hours.
                </p>
              </div>
            </Reveal>
          </aside>
        </div>
      </section>

      <Footer />
    </>
  );
}
