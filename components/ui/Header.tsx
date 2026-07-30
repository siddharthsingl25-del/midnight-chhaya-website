"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Menu, X, ChevronDown } from "lucide-react";
import { NAV, SITE } from "@/lib/site";
import { useProducts } from "@/lib/catalog-context";
import InstagramButton from "./InstagramButton";
import CartButton from "./CartButton";
import { easeCinematic } from "@/lib/animations";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [mobileOpenSection, setMobileOpenSection] = useState<string | null>(null);
  // Push the header down when the PreOrderBanner is showing so its
  // fixed row doesn't overlay the nav.
  const products = useProducts();
  const hasPreOrder = products.some((p) => p.isPreOrder);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      style={{ top: hasPreOrder ? "var(--banner-h, 32px)" : 0 }}
      className={[
        "fixed left-0 right-0 z-50 transition-colors duration-700",
        scrolled
          ? "bg-ink/80 backdrop-blur-md border-b border-bone/5"
          : "bg-transparent",
      ].join(" ")}
    >
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-4 md:px-10 md:py-5 gap-3">
        {/* Hamburger — opens the category drawer. Sits on the LEFT
         * of every viewport (no longer mobile-only). */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
          className="text-bone hover:text-gold transition-colors p-2 -ml-2"
        >
          {open ? <X size={22} strokeWidth={1.5} /> : <Menu size={22} strokeWidth={1.5} />}
        </button>

        <Link
          href="/"
          aria-label={`${SITE.name} — home`}
          data-cursor="Home"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
            setOpen(false);
          }}
          className="flex items-center mx-auto"
        >
          <Image
            src={SITE.logoPath}
            alt={SITE.name}
            width={776}
            height={321}
            priority
            className="h-11 sm:h-14 w-auto select-none"
          />
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <InstagramButton />
          <CartButton />
        </div>
      </div>

      {/* Drawer — used to be mobile-only; now every viewport (the top-left
       * hamburger is the only way to browse categories from the header). */}
      <motion.div
        initial={false}
        animate={{
          height: open ? "auto" : 0,
          opacity: open ? 1 : 0,
        }}
        transition={{ duration: 0.5, ease: easeCinematic }}
        className="overflow-hidden border-t border-bone/5 bg-ink/95 backdrop-blur"
      >
        <nav className="flex flex-col px-6 py-6 gap-1">
          {NAV.map((item) => {
            const expanded = mobileOpenSection === item.label;
            if (!item.children) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="eyebrow text-bone py-3 border-b border-bone/5"
                >
                  {item.label}
                </Link>
              );
            }
            return (
              <div key={item.href} className="border-b border-bone/5">
                <button
                  type="button"
                  onClick={() =>
                    setMobileOpenSection(expanded ? null : item.label)
                  }
                  aria-expanded={expanded}
                  className="flex w-full items-center justify-between py-3"
                >
                  <span className="eyebrow text-bone">{item.label}</span>
                  <ChevronDown
                    size={16}
                    strokeWidth={1.5}
                    className={`text-gold transition-transform duration-500 ${expanded ? "rotate-180" : ""}`}
                  />
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: expanded ? "auto" : 0 }}
                  transition={{ duration: 0.4, ease: easeCinematic }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-col pl-4 pb-3 gap-2">
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="font-body text-bone-dim hover:text-gold py-1.5 text-sm"
                    >
                      All {item.label.toLowerCase()}
                    </Link>
                    {item.children.map((c) => (
                      <Link
                        key={c.href}
                        href={c.href}
                        onClick={() => setOpen(false)}
                        className="font-body text-bone-dim hover:text-gold py-1.5 text-sm"
                      >
                        {c.label}
                      </Link>
                    ))}
                  </div>
                </motion.div>
              </div>
            );
          })}
        </nav>
      </motion.div>
    </header>
  );
}

