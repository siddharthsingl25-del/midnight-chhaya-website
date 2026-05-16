"use client";

/**
 * Lenis smooth-scroll wrapper.
 * - Lerp 0.08 gives the heavy, deliberate feel we want for the brand.
 * - Disabled automatically for prefers-reduced-motion (Lenis respects this).
 */

import { ReactLenis } from "lenis/react";
import type { ReactNode } from "react";

export default function SmoothScroll({ children }: { children: ReactNode }) {
  return (
    <ReactLenis
      root
      options={{
        lerp: 0.08,
        duration: 1.2,
        smoothWheel: true,
        // touch is left native — Lenis on touch can feel laggy
      }}
    >
      {children}
    </ReactLenis>
  );
}
