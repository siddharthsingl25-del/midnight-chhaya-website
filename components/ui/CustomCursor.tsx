"use client";

/**
 * Hover label cursor.
 *
 * Native cursor stays as-is everywhere. When the pointer enters an
 * element that has `data-cursor="<label>"`, a large gold disc fades in
 * at the cursor position with the label text inside it. Leaving the
 * element fades it out again.
 *
 * Hidden entirely on touch devices and `prefers-reduced-motion` users
 * via the `.desktop-only` utility in globals.css.
 */

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";

const SIZE = 140; // diameter, px

export default function CustomCursor() {
  const x = useMotionValue(-200);
  const y = useMotionValue(-200);
  // springs make the disc feel weighted as it trails the cursor
  const sx = useSpring(x, { stiffness: 350, damping: 28, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 350, damping: 28, mass: 0.4 });

  const [label, setLabel] = useState<string | null>(null);
  const labelRef = useRef<string | null>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };

    const onOver = (e: MouseEvent) => {
      // Only opt-in elements (data-cursor="<label>") trigger the disc.
      // No fallback to button text — keeps the rest of the UI clean.
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>(
        "[data-cursor]"
      );
      const next = el?.dataset.cursor || null;
      if (labelRef.current !== next) {
        labelRef.current = next;
        setLabel(next);
      }
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
    };
  }, [x, y]);

  return (
    <motion.div
      aria-hidden
      className="desktop-only pointer-events-none fixed top-0 left-0 z-[100]"
      style={{ x: sx, y: sy, translateX: "-50%", translateY: "-50%" }}
    >
      <AnimatePresence>
        {label ? (
          <motion.div
            key="disc"
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.4 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="grid place-items-center rounded-full bg-gold
                       shadow-[0_0_60px_-12px_rgba(184,147,90,0.7)]"
            style={{ width: SIZE, height: SIZE }}
          >
            <span
              className="font-body uppercase text-ink text-[11px] tracking-[0.25em] font-semibold
                         text-center px-5 leading-tight"
            >
              {label}
            </span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
