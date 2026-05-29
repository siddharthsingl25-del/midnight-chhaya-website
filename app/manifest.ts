import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/**
 * Web App Manifest.
 *
 * Makes the site installable on a phone's home screen via the browser's
 * "Add to home screen" prompt (Android Chrome) or the iOS Safari Share
 * sheet → Add to Home Screen.
 *
 * Once installed it:
 *   - opens straight to /admin (so the merchant lands on the Stock tab)
 *   - launches in standalone mode (no browser chrome)
 *   - uses the brand colors instead of the OS default white flash
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} · Admin`,
    short_name: "Chhaya Admin",
    description: "Stock, products and orders for Midnight Chhaya.",
    start_url: "/admin",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0d0c0a",
    theme_color: "#0d0c0a",
    icons: [
      {
        src: "/brand/logo.png",
        sizes: "any",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/logo.png",
        sizes: "any",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
