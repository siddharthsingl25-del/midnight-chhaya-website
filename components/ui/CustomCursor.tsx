"use client";

/**
 * Custom cursor — small gold circle, grows + shows a label over interactive
 * elements that opt-in via `data-cursor="<label>"`.
 *
 * Magnetic pull on `data-cursor-magnetic` elements (primary CTAs).
 * Hidden on touch devices and reduced-motion via CSS (.desktop-only).
 */

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function CustomCursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  // springs make the cursor feel weighted, not snappy
  const sx = useSpring(x, { stiffness: 350, damping: 28, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 350, damping: 28, mass: 0.4 });

  const [label, setLabel] = useState<string | null>(null);
  const [hovering, setHovering] = useState(false);
  const labelRef = useRef<string | null>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };

    const onOver = (e: MouseEvent) => {
      const el = (e.target as HTMLElement)?.closest<HTMLElement>(
        "[data-cursor], a, button"
      );
      if (!el) {
        if (labelRef.current !== null) {
          labelRef.current = null;
          setLabel(null);
          setHovering(false);
        }
        return;
      }
      const next = el.dataset.cursor ?? "";
      if (labelRef.current !== next) {
        labelRef.current = next;
        setLabel(next || null);
        setHovering(true);
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
      className="desktop-only pointer-events-none fixed top-0 left-0 z-[100] flex items-center justify-center"
      style={{ x: sx, y: sy, translateX: "-50%", translateY: "-50%" }}
    >
      <motion.div
        className="rounded-full border border-gold/80 bg-gold/10 backdrop-blur-[1px]"
        animate={{
          width: hovering ? (label ? 96 : 36) : 14,
          height: hovering ? (label ? 96 : 36) : 14,
          opacity: hovering ? 1 : 0.85,
        }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      />
      {label ? (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute text-[10px] tracking-[0.3em] uppercase text-gold-soft font-body"
        >
          {label}
        </motion.span>
      ) : null}
    </motion.div>
  );
}
