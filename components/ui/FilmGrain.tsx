"use client";

/**
 * Animated film grain — kept restrained (opacity ~6%, overlay blend mode).
 * See `.film-grain` in globals.css for the actual texture/animation.
 *
 * Disabled on Instagram / Facebook in-app browsers where the endless
 * CSS animation adds enough GPU pressure to crash Meta's WebView.
 */

import { useEffect, useState } from "react";

export default function FilmGrain() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const ua = navigator.userAgent || "";
    const isInApp = /Instagram|FBAN|FBAV|FB_IAB/i.test(ua);
    setShow(!isInApp);
  }, []);
  if (!show) return null;
  return <div className="film-grain" aria-hidden />;
}
