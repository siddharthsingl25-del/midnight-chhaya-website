"use client";

/**
 * Defensive wrapper around HeroAtmosphere so a WebGL failure or an
 * incompatible browser can never blank the whole page.
 *
 *   - Only mounts after WebGL support is confirmed.
 *   - Any runtime error inside the WebGL scene renders nothing rather
 *     than propagating up and blanking the hero.
 *   - Only mounts on the client after `window` is available so an SSR
 *     glitch can't hurt the initial paint either.
 *
 * Instagram / Facebook in-app browsers never see this — the /lite
 * middleware redirect serves them a static page instead.
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
    const supportsWebGL = (() => {
      try {
        const canvas = document.createElement("canvas");
        return !!(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
      } catch {
        return false;
      }
    })();
    setEnabled(supportsWebGL);
  }, []);

  if (!enabled) return null;

  return (
    <WebglErrorBoundary>
      <HeroAtmosphere />
    </WebglErrorBoundary>
  );
}
