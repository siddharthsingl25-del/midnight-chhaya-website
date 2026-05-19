"use client";

/**
 * Cart button + panel.
 *
 * Reads from <CartProvider> (lib/cart.tsx). Empty-state mirrors the rest
 * of the brand voice. With items, lists each line with thumbnail + qty
 * controls + line total, shows the running total, and exposes:
 *   - "Copy order" → puts a plaintext order list on the clipboard so the
 *     buyer can paste it into Instagram DM
 *   - "Inquire on Instagram" → opens the IG profile in a new tab
 *
 * When real checkout lands, swap the IG CTA for your payment-gateway
 * call using `useCart().items` and `useCart().total()`.
 */

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, ShoppingBag, Trash2, X, Check } from "lucide-react";
import InstagramIcon from "./icons/InstagramIcon";
import { easeCinematic } from "@/lib/animations";
import { useCart } from "@/lib/cart";
import { computeShipping, formatPrice, SHIPPING_THRESHOLD, SITE } from "@/lib/site";

export default function CartButton() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { count, total, detailed, setQty, remove, ready } = useCart();
  const lines = detailed();
  const subtotal = total();
  const shipping = computeShipping(subtotal);
  const grandTotal = subtotal + shipping;

  // close when clicking outside / on Escape
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

  const copyOrder = async () => {
    const text = [
      `Hi Midnight Chhaya — I'd like to inquire about:`,
      ...lines.map(({ line, product, chain, unitPrice }) => {
        const chainSuffix = chain ? ` (chain: ${chain.name})` : "";
        return `• ${product.name}${chainSuffix} × ${line.qty} (${formatPrice(unitPrice)})`;
      }),
      ``,
      `Subtotal: ${formatPrice(subtotal)}`,
      `Shipping: ${shipping === 0 ? "Free" : formatPrice(shipping)}`,
      `Total: ${formatPrice(grandTotal)}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard may be blocked — silently no-op */
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Open cart (${count} items)`}
        aria-expanded={open}
        data-cursor="Cart"
        className="relative grid place-items-center rounded-full border border-gold/30 p-2
                   text-gold transition-all duration-500
                   hover:border-gold hover:text-gold-soft
                   hover:shadow-[0_0_18px_-2px_rgba(184,147,90,0.45)]"
      >
        <ShoppingBag size={18} strokeWidth={1.25} />
        {ready && count > 0 ? (
          <motion.span
            key={count}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, ease: easeCinematic }}
            className="absolute -top-1 -right-1 grid place-items-center min-w-[18px] h-[18px] px-1
                       rounded-full bg-gold text-ink text-[10px] font-medium pointer-events-none"
          >
            {count}
          </motion.span>
        ) : null}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: easeCinematic }}
            className="absolute right-0 mt-3 w-[88vw] sm:w-96 z-50
                       bg-ink/95 backdrop-blur-md border border-bone/10
                       text-left max-h-[78vh] flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-bone/10">
              <span className="eyebrow">Your cart{count > 0 ? ` · ${count}` : ""}</span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-bone-dim hover:text-bone transition-colors"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>

            {lines.length === 0 ? (
              <div className="px-6 py-8">
                <p className="font-serif italic text-bone-dim text-base leading-relaxed mb-5">
                  Empty for now. Add pieces with the + button on any product,
                  then send the list our way on Instagram.
                </p>
                <a
                  href={SITE.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor="Inquire"
                  className="inline-flex items-center gap-3 px-5 py-3
                             border border-gold/60 text-gold w-full justify-center
                             transition-colors duration-500
                             hover:bg-gold hover:text-ink"
                >
                  <InstagramIcon size={16} />
                  <span className="eyebrow">Inquire on Instagram</span>
                </a>
              </div>
            ) : (
              <>
                <ul className="flex-1 overflow-y-auto divide-y divide-bone/5">
                  {lines.map(({ line, product, chain, unitPrice }) => {
                    const lineKey = `${line.slug}|${line.chainId ?? ""}`;
                    return (
                      <li key={lineKey} className="flex gap-4 px-6 py-4">
                        <Link
                          href={`/collections/${product.slug}`}
                          onClick={() => setOpen(false)}
                          className="relative w-16 h-20 flex-shrink-0 overflow-hidden bg-charcoal"
                        >
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/collections/${product.slug}`}
                            onClick={() => setOpen(false)}
                            className="block font-display text-sm text-bone hover:text-gold transition-colors truncate"
                          >
                            {product.name}
                          </Link>
                          {chain ? (
                            <span className="block text-[10px] uppercase tracking-[0.2em] text-gold-soft mt-0.5">
                              {chain.name}
                            </span>
                          ) : null}
                          <span className="block text-xs text-bone-dim mt-1">
                            {formatPrice(unitPrice)}
                          </span>
                          <div className="mt-2 flex items-center gap-3">
                            <div className="inline-flex items-center border border-bone/15">
                              <button
                                onClick={() => setQty(line.slug, line.qty - 1, line.chainId)}
                                aria-label="Decrease"
                                className="p-1.5 text-bone-dim hover:text-gold transition-colors"
                              >
                                <Minus size={12} strokeWidth={1.5} />
                              </button>
                              <span className="px-2 text-xs text-bone min-w-[20px] text-center">
                                {line.qty}
                              </span>
                              <button
                                onClick={() => setQty(line.slug, line.qty + 1, line.chainId)}
                                aria-label="Increase"
                                className="p-1.5 text-bone-dim hover:text-gold transition-colors"
                              >
                                <Plus size={12} strokeWidth={1.5} />
                              </button>
                            </div>
                            <button
                              onClick={() => remove(line.slug, line.chainId)}
                              aria-label="Remove"
                              className="text-bone-dim hover:text-oxblood transition-colors"
                            >
                              <Trash2 size={14} strokeWidth={1.5} />
                            </button>
                          </div>
                        </div>
                        <span className="text-sm text-bone whitespace-nowrap">
                          {unitPrice != null
                            ? formatPrice(unitPrice * line.qty)
                            : "Inquire"}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                <div className="border-t border-bone/10 px-6 py-5">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="eyebrow text-bone-dim text-[10px]">Subtotal</span>
                    <span className="text-sm text-bone">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="eyebrow text-bone-dim text-[10px]">Shipping</span>
                    <span className={`text-sm ${shipping === 0 ? "text-gold" : "text-bone"}`}>
                      {shipping === 0 ? "Free" : formatPrice(shipping)}
                    </span>
                  </div>
                  {shipping > 0 ? (
                    <p className="text-[10px] text-bone-dim italic mb-3">
                      Add {formatPrice(SHIPPING_THRESHOLD - subtotal)} more for free shipping.
                    </p>
                  ) : null}
                  <div className="flex items-baseline justify-between mb-4 pt-2 border-t border-bone/10">
                    <span className="eyebrow text-bone-dim">Total</span>
                    <span className="font-display text-lg text-bone">
                      {formatPrice(grandTotal)}
                    </span>
                  </div>

                  <Link
                    href="/checkout"
                    onClick={() => setOpen(false)}
                    data-cursor="Checkout"
                    className="inline-flex items-center justify-center gap-3 w-full px-5 py-3
                               bg-gold text-ink
                               transition-all duration-500
                               hover:shadow-[0_0_24px_-4px_rgba(184,147,90,0.55)]"
                  >
                    <span className="eyebrow text-[11px] text-ink">Checkout · {formatPrice(grandTotal)}</span>
                  </Link>

                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <button
                      onClick={copyOrder}
                      data-cursor={copied ? "Copied" : "Copy"}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2.5
                                 border border-bone/20 text-bone-dim
                                 transition-colors duration-500
                                 hover:border-bone hover:text-bone"
                    >
                      {copied ? (
                        <>
                          <Check size={12} strokeWidth={1.5} />
                          <span className="eyebrow text-[10px]">Copied</span>
                        </>
                      ) : (
                        <span className="eyebrow text-[10px]">Copy order</span>
                      )}
                    </button>
                    <a
                      href={SITE.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-cursor="Inquire"
                      className="inline-flex items-center justify-center gap-2 px-3 py-2.5
                                 border border-bone/20 text-bone-dim
                                 transition-colors duration-500
                                 hover:border-bone hover:text-bone"
                    >
                      <InstagramIcon size={12} />
                      <span className="eyebrow text-[10px]">Inquire</span>
                    </a>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
