"use client";

/**
 * Lenis smooth-scroll wrapper.
 * - Lerp 0.08 gives the heavy, deliberate feel we want for the brand.
 * - Touch scrolling is left native (Lenis touch mode feels laggy).
 * - Instagram/FB in-app browsers never see this — /lite middleware
 *   redirect serves them a static page instead.
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
      }}
    >
      {children}
    </ReactLenis>
  );
}
