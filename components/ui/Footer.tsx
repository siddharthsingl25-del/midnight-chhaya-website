import Link from "next/link";
import Image from "next/image";
import { NAV, SITE } from "@/lib/site";
import InstagramButton from "./InstagramButton";

export default function Footer() {
  return (
    <footer className="relative border-t border-bone/5 px-6 md:px-10 pt-20 pb-10">
      <div className="mx-auto max-w-[1400px] grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-6 items-start">
        {/* brand */}
        <div className="flex flex-col gap-5">
          <Link href="/" className="flex items-center" data-cursor="Home">
            <Image
              src={SITE.logoPath}
              alt={SITE.name}
              width={776}
              height={321}
              className="h-8 w-auto select-none"
            />
          </Link>
          <p className="font-serif italic text-bone-dim max-w-xs">
            {SITE.tagline}
          </p>
        </div>

        {/* nav */}
        <nav className="flex flex-col gap-3 md:items-center" aria-label="Footer">
          <span className="eyebrow text-bone-dim">Index</span>
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              data-cursor={item.label}
              className="font-body text-bone hover:text-gold transition-colors duration-500 gold-underline self-start md:self-auto"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* contact + social */}
        <div className="flex flex-col gap-4 md:items-end">
          <span className="eyebrow text-bone-dim">Find us</span>
          <a
            href={`mailto:${SITE.email}`}
            data-cursor="Write us"
            className="font-body text-bone hover:text-gold transition-colors duration-500 gold-underline"
          >
            {SITE.email}
          </a>
          <InstagramButton variant="label" label={SITE.instagramHandle} />
        </div>
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
