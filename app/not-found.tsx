import Link from "next/link";
import Footer from "@/components/ui/Footer";

export default function NotFound() {
  return (
    <>
      <section className="px-6 md:px-10 pt-40 pb-32 min-h-[80vh] flex items-center">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow block mb-6">404 · Lost in shadow</span>
          <h1 className="font-display uppercase text-bone text-[clamp(2.5rem,8vw,5rem)] leading-[1.05]">
            This page was never made.
          </h1>
          <p className="font-serif italic text-bone-dim text-lg mt-8 max-w-md mx-auto">
            Perhaps it was, and we polished it away. Try one of these instead.
          </p>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {[
              { label: "Home",         href: "/" },
              { label: "Collections",  href: "/collections" },
              { label: "Lookbook",     href: "/lookbook" },
              { label: "Contact",      href: "/contact" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                data-cursor={l.label}
                className="eyebrow text-gold gold-underline"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
