import Link from "next/link";
import Image from "next/image";
import { FOOTER_NAV, SITE } from "@/lib/site";
import InstagramButton from "./InstagramButton";

export default function Footer() {
  return (
    <footer className="relative border-t border-bone/5 px-6 md:px-10 pt-20 pb-10">
      <div className="mx-auto max-w-[1400px] grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-10 items-start">
        {/* brand */}
        <div className="md:col-span-4 flex flex-col gap-5">
          <Link href="/" className="flex items-center" data-cursor="Home">
            <Image
              src={SITE.logoPath}
              alt={SITE.name}
              width={776}
              height={321}
              className="h-9 w-auto select-none"
            />
          </Link>
          <p className="font-serif italic text-bone-dim max-w-xs">
            {SITE.tagline}
          </p>
          <div className="flex flex-col gap-3 mt-2">
            <InstagramButton variant="label" label={SITE.instagramHandle} />
          </div>
        </div>

        {/* nav columns */}
        {FOOTER_NAV.map((col) => (
          <nav
            key={col.heading}
            className="md:col-span-2 lg:col-span-2 xl:col-span-2 flex flex-col gap-3"
            aria-label={col.heading}
          >
            <span className="eyebrow text-bone-dim mb-1">{col.heading}</span>
            {col.links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                data-cursor={l.label}
                className="font-body text-sm text-bone hover:text-gold transition-colors duration-500 gold-underline self-start"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        ))}
      </div>

      <div className="mx-auto max-w-[1400px] mt-16 pt-8 border-t border-bone/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-bone-dim">
        <span className="eyebrow normal-case tracking-[0.25em]">
          © {new Date().getFullYear()} {SITE.name}. All rights reserved.
        </span>
        <span className="eyebrow normal-case tracking-[0.25em]">
          Handcrafted in shadow.
        </span>
      </div>
    </footer>
  );
}
