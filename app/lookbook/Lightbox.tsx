"use client";

/**
 * Lightbox — full-bleed image viewer with keyboard + button navigation.
 * Locks body scroll while open, closes on Escape or backdrop click.
 */

import { useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { easeCinematic } from "@/lib/animations";
import type { LookbookImage } from "@/data/lookbook";

type Props = {
  images: LookbookImage[];
  index: number | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
};

export default function Lightbox({ images, index, onClose, onPrev, onNext }: Props) {
  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") onPrev();
      else if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [index, onClose, onPrev, onNext]);

  return (
    <AnimatePresence>
      {index !== null ? (
        <motion.div
          key="lb"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: easeCinematic }}
          className="fixed inset-0 z-[120] bg-ink/95 backdrop-blur-sm flex items-center justify-center px-4 py-12"
          onClick={onClose}
        >
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            aria-label="Close"
            data-cursor="Close"
            className="absolute top-6 right-6 text-bone-dim hover:text-gold transition-colors duration-300 p-3"
          >
            <X size={22} strokeWidth={1.25} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            aria-label="Previous"
            data-cursor="Prev"
            className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 text-bone-dim hover:text-gold transition-colors duration-300 p-3"
          >
            <ChevronLeft size={28} strokeWidth={1.25} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            aria-label="Next"
            data-cursor="Next"
            className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 text-bone-dim hover:text-gold transition-colors duration-300 p-3"
          >
            <ChevronRight size={28} strokeWidth={1.25} />
          </button>

          <motion.div
            key={images[index].id}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: easeCinematic }}
            className="relative w-full max-w-5xl"
            style={{ aspectRatio: 1 / images[index].ratio }}
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[index].src}
              alt={images[index].alt}
              fill
              sizes="100vw"
              priority
              className="object-contain"
            />
            <span className="absolute -bottom-10 left-0 right-0 text-center eyebrow text-bone-dim">
              {String(index + 1).padStart(2, "0")} · {images[index].alt}
            </span>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
