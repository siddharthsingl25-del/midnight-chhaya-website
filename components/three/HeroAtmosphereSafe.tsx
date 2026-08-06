"use client";

/**
 * Defensive wrapper around HeroAtmosphere so a WebGL failure or an
 * incompatible browser (Instagram in-app browser, low-end Android,
 * disabled hardware acceleration) can never blank the whole page.
 *
 *   - Small phones (< 640px) skip the R3F canvas entirely — cheaper
 *     to render and avoids the class of WebGL crashes we were seeing
 *     as "site won't open" for a chunk of mobile visitors.
 *   - Any runtime error inside the WebGL scene renders nothing rather
 *     than propagating up and blanking the hero.
 *   - Only mounts on the client after `window` is available so an SSR
 *     glitch can't hurt the initial paint either.
 */

import { Component, type ReactNode, useEffect, useState } from "react";
import dynamic from "next/dynamic";

const HeroAtmosphere = dynamic(() => import("./HeroAtmosphere"), {
  ssr: false,
  loading: () => null,
});

class WebglErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err: unknown) {
    console.warn("[HeroAtmosphere] disabled after runtime error:", err);
  }
  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

export default function HeroAtmosphereSafe() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // Skip WebGL on:
    //  - Any Instagram / Facebook in-app browser (their WebView crashes
    //    with "A problem repeatedly occurred" on WebGL scenes)
    //  - Any touch device (tablets and phones — desktop keeps the FX)
    //  - Anything without WebGL support
    const ua = navigator.userAgent || "";
    const isInApp = /Instagram|FBAN|FBAV|FB_IAB/i.test(ua);
    const isTouch = navigator.maxTouchPoints > 0 || /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
    const supportsWebGL = (() => {
      try {
        const canvas = document.createElement("canvas");
        return !!(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
      } catch {
        return false;
      }
    })();
    setEnabled(!isInApp && !isTouch && supportsWebGL);
  }, []);

  if (!enabled) return null;

  return (
    <WebglErrorBoundary>
      <HeroAtmosphere />
    </WebglErrorBoundary>
  );
}
