"use client";

/**
 * Lenis smooth-scroll wrapper.
 * - Lerp 0.08 gives the heavy, deliberate feel we want for the brand.
 * - Disabled entirely on Instagram / Facebook in-app browsers and any
 *   touch device: Lenis attaches scroll listeners + rAF loops that
 *   Meta's WebView chokes on, causing "A problem repeatedly occurred"
 *   crashes. Desktop keeps the smooth-scroll feel.
 */

import { ReactLenis } from "lenis/react";
import { useEffect, useState, type ReactNode } from "react";

export default function SmoothScroll({ children }: { children: ReactNode }) {
  const [enableLenis, setEnableLenis] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const ua = navigator.userAgent || "";
    const isInApp = /Instagram|FBAN|FBAV|FB_IAB/i.test(ua);
    const isTouch = navigator.maxTouchPoints > 0 || /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
    // Only mount Lenis on non-touch desktop devices with no in-app browser.
    setEnableLenis(!isInApp && !isTouch);
  }, []);

  if (!enableLenis) return <>{children}</>;

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
