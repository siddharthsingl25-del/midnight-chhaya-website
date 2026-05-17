"use client";

/**
 * Cart button — UI scaffold for a future cart.
 *
 * No real cart state yet (no payment gateway). Clicking opens a small
 * dropdown that says the cart is empty and points to Instagram for
 * inquiries. When checkout lands (Razorpay / Stripe / Shopify), wire
 * a real cart store (Zustand / context) into the `count` + panel here.
 */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import InstagramIcon from "./icons/InstagramIcon";
import { easeCinematic } from "@/lib/animations";
import { SITE } from "@/lib/site";

export default function CartButton() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const count = 0;

  // close when clicking outside
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open cart"
        aria-expanded={open}
        data-cursor="Cart"
        className="relative grid place-items-center rounded-full border border-gold/30 p-2
                   text-gold transition-all duration-500
                   hover:border-gold hover:text-gold-soft
                   hover:shadow-[0_0_18px_-2px_rgba(184,147,90,0.45)]"
      >
        <ShoppingBag size={18} strokeWidth={1.25} />
        {count > 0 ? (
          <span className="absolute -top-1 -right-1 grid place-items-center min-w-[18px] h-[18px] px-1
                           rounded-full bg-gold text-ink text-[10px] font-medium">
            {count}
          </span>
        ) : null}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: easeCinematic }}
            className="absolute right-0 mt-3 w-72 sm:w-80 z-50
                       bg-ink/95 backdrop-blur-md border border-bone/10
                       p-6 text-left"
          >
            <span className="eyebrow block mb-3">Your cart</span>
            <p className="font-serif italic text-bone-dim text-base leading-relaxed mb-5">
              Empty for now. Online checkout is coming soon — for any piece
              you'd like to acquire, message us on Instagram and we'll arrange
              it directly.
            </p>
            <a
              href={SITE.instagram}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="Inquire"
              className="group inline-flex items-center gap-3 px-5 py-3
                         border border-gold/60 text-gold w-full justify-center
                         transition-colors duration-500
                         hover:bg-gold hover:text-ink"
            >
              <InstagramIcon size={16} />
              <span className="eyebrow">Inquire on Instagram</span>
            </a>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
