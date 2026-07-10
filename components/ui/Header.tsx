"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown } from "lucide-react";
import { NAV, SITE, type NavItem } from "@/lib/site";
import { useProducts } from "@/lib/catalog-context";
import InstagramButton from "./InstagramButton";
import CartButton from "./CartButton";
import { easeCinematic } from "@/lib/animations";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
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
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-4 md:px-10 md:py-5 gap-4">
        <Link
          href="/"
          aria-label={`${SITE.name} — home`}
          data-cursor="Home"
          onClick={() => {
            // Always take the customer to the very top of the home
            // page, even if they're already on '/' and Next.js short-
            // circuits the navigation.
            if (typeof window !== "undefined") {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
            setOpen(false);
          }}
          className="flex items-center"
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

        {/* desktop nav */}
        <nav className="hidden lg:flex items-center gap-8 xl:gap-10">
          {NAV.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isOpen={openMenu === item.label}
              onEnter={() => setOpenMenu(item.label)}
              onLeave={() => setOpenMenu(null)}
            />
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <InstagramButton />
          <CartButton />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            className="lg:hidden text-bone p-2"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* mobile drawer */}
      <motion.div
        initial={false}
        animate={{
          height: open ? "auto" : 0,
          opacity: open ? 1 : 0,
        }}
        transition={{ duration: 0.5, ease: easeCinematic }}
        className="lg:hidden overflow-hidden border-t border-bone/5 bg-ink/95 backdrop-blur"
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

/* Desktop nav item — supports hover-triggered dropdown when `children` exist. */
function NavLink({
  item,
  isOpen,
  onEnter,
  onLeave,
}: {
  item: NavItem;
  isOpen: boolean;
  onEnter: () => void;
  onLeave: () => void;
}) {
  if (!item.children) {
    return (
      <Link
        href={item.href}
        data-cursor={item.label}
        className="eyebrow text-bone hover:text-gold transition-colors duration-500 gold-underline whitespace-nowrap"
      >
        {item.label}
      </Link>
    );
  }

  return (
    <div className="relative" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <Link
        href={item.href}
        data-cursor={item.label}
        className="eyebrow inline-flex items-center gap-1.5 text-bone hover:text-gold transition-colors duration-500 gold-underline whitespace-nowrap"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {item.label}
        <ChevronDown
          size={12}
          strokeWidth={1.75}
          className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
      </Link>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: easeCinematic }}
            /* pt creates a hover "bridge" so cursor can cross the gap */
            className="absolute left-1/2 -translate-x-1/2 top-full pt-4 z-50"
          >
            <div className="min-w-[200px] bg-ink/95 backdrop-blur-md border border-bone/10 py-3">
              {item.children.map((c) => (
                <Link
                  key={c.href}
                  href={c.href}
                  data-cursor={c.label}
                  className="block px-5 py-2.5 font-body text-sm text-bone-dim
                             hover:text-gold hover:bg-gold/5
                             transition-colors duration-300"
                >
                  {c.label}
                </Link>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
