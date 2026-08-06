"use client";

/**
 * Top announcement bar. Sits above the header on every page.
 *
 * Rotates through a fixed list of merchant-controlled messages so
 * there's no dependency on live catalog state. Edit BANNER_MESSAGES
 * below to change what's shown. If the list is empty the bar
 * hides itself.
 */

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const ROTATE_MS = 3500;

type BannerMessage = { text: string; href?: string };

const BANNER_MESSAGES: readonly BannerMessage[] = [
  { text: "Free shipping on orders above ₹1100" },
  { text: "Pre-book your chrome earphone now", href: "/collections?cat=earbuds" },
];

export default function PreOrderBanner() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (BANNER_MESSAGES.length <= 1) return;
    // Skip the rotation loop in Instagram/Facebook in-app browsers —
    // the setInterval + framer motion re-mount adds pressure that can
    // contribute to WebView crashes. Show only the first message there.
    if (typeof navigator !== "undefined" && /Instagram|FBAN|FBAV|FB_IAB/i.test(navigator.userAgent || "")) {
      return;
    }
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % BANNER_MESSAGES.length);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, []);

  if (BANNER_MESSAGES.length === 0) return null;

  const current = BANNER_MESSAGES[index % BANNER_MESSAGES.length];
  const Inner = (
    <>
      <span>{current.text}</span>
      {current.href ? <span className="ml-3 opacity-60">→</span> : null}
    </>
  );

  return (
    <div
      style={{ height: "32px" }}
      className="fixed top-0 left-0 right-0 z-[70] w-full bg-gold text-ink
                 border-b border-gold-soft overflow-hidden"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="absolute inset-0"
        >
          {current.href ? (
            <a
              href={current.href}
              className="flex w-full h-full items-center justify-center px-4
                         text-[11px] sm:text-xs uppercase tracking-[0.18em]
                         font-medium hover:bg-gold-soft transition-colors duration-500"
            >
              {Inner}
            </a>
          ) : (
            <div
              className="flex w-full h-full items-center justify-center px-4
                         text-[11px] sm:text-xs uppercase tracking-[0.18em] font-medium"
            >
              {Inner}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
