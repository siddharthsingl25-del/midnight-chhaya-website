"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { NAV, SITE } from "@/lib/site";
import InstagramButton from "./InstagramButton";
import { easeCinematic } from "@/lib/animations";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.1, ease: easeCinematic, delay: 0.2 }}
      className={[
        "fixed top-0 left-0 right-0 z-50 transition-colors duration-700",
        scrolled
          ? "bg-ink/70 backdrop-blur-md border-b border-bone/5"
          : "bg-transparent",
      ].join(" ")}
    >
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-5 md:px-10 md:py-6">
        <Link
          href="/"
          aria-label={`${SITE.name} — home`}
          data-cursor="Home"
          className="flex items-center"
        >
          {/* Wordmark logo — width derived from height × intrinsic aspect. */}
          <Image
            src={SITE.logoPath}
            alt={SITE.name}
            width={776}
            height={321}
            priority
            className="h-11 sm:h-14 w-auto select-none"
          />
        </Link>

        <nav className="hidden md:flex items-center gap-10">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              data-cursor={item.label}
              className="eyebrow text-bone hover:text-gold transition-colors duration-500 gold-underline"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <InstagramButton />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            className="md:hidden text-bone p-2"
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
        className="md:hidden overflow-hidden border-t border-bone/5 bg-ink/95 backdrop-blur"
      >
        <nav className="flex flex-col px-6 py-6 gap-5">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="eyebrow text-bone"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </motion.div>
    </motion.header>
  );
}
