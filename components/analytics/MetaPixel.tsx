"use client";

/**
 * Meta (Facebook) Pixel.
 *
 * Loads the fbevents.js once, fires PageView on the initial load and on
 * every subsequent client-side navigation. Ecommerce events (AddToCart,
 * Purchase, etc) fire via the trackFbq() helper below — call it from
 * the checkout success / add-to-cart handlers when you want to feed
 * Meta's ad optimisation more granular signals.
 *
 * Pixel ID lives in this file — if it ever needs to rotate, edit the
 * PIXEL_ID constant and redeploy.
 */

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const PIXEL_ID = "1087270557063626";

/** Global type for fbq — set once fbevents.js loads. */
declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

/** True inside Instagram's or Facebook's in-app WebView. These
 * embedded browsers crash on their own Meta Pixel script (double-
 * tracking / memory-pressure), so we skip the pixel there. Meta's
 * fbclid parameter still gets attributed server-side, so no data lost. */
function isMetaInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /Instagram|FBAN|FBAV|FB_IAB/i.test(ua);
}

export default function MetaPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Fire PageView on every route change. Next's App Router doesn't do
  // a full page load, so the pixel snippet's initial track() only
  // catches the first landing.
  useEffect(() => {
    if (typeof window === "undefined" || !window.fbq) return;
    window.fbq("track", "PageView");
  }, [pathname, searchParams]);

  // Skip the pixel entirely on Instagram/Facebook in-app browsers.
  // Their WebViews crash ("A problem repeatedly occurred") when Meta's
  // own tracking script runs inside their own embedded browser.
  if (typeof window !== "undefined" && isMetaInAppBrowser()) {
    return null;
  }

  return (
    <>
      <Script
        id="meta-pixel-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${PIXEL_ID}');
            fbq('track', 'PageView');
          `,
        }}
      />
      {/* Fallback for users with JS disabled — Meta still counts these. */}
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}

/** Fire a Standard or Custom Meta event. Safe to call before the pixel
 * has loaded — fbq queues events until it's ready. Examples:
 *   trackFbq("AddToCart", { content_ids: [slug], value: 299, currency: "INR" })
 *   trackFbq("Purchase",  { value: 1149, currency: "INR", num_items: 2 }) */
export function trackFbq(event: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("track", event, params);
}
