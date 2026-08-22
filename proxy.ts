/**
 * Edge proxy (formerly middleware.ts — the `middleware` convention is
 * deprecated as of Next 16 and renamed to `proxy`).
 *
 * Two jobs:
 *
 *   1. MAINTENANCE MODE. While MAINTENANCE is true the whole storefront is
 *      closed and every request gets a 503 holding page instead. Flip the
 *      constant to false and redeploy to reopen the shop.
 *
 *   2. Force every visitor on the legacy vercel.app URL (or the www.
 *      subdomain) to the branded midnightchhaya.com — permanent 308,
 *      preserving path + query.
 *
 * The Razorpay webhook is exempt from BOTH — it must never be redirected
 * (Razorpay does not follow 308s on webhook POSTs) and must never be
 * blocked (a payment that completes during maintenance would otherwise
 * never be recorded and the order would be lost).
 */

import { NextResponse, type NextRequest } from "next/server";

const CANONICAL_HOST = "midnightchhaya.com";

/* ─── Maintenance mode ──────────────────────────────────────────────────
 * Set to false and redeploy to reopen the storefront. */
const MAINTENANCE = true;

/** Shown on the holding page. */
const MAINTENANCE_LINES = [
  "New stock is updating.",
  "The website will open today by 8 PM.",
];

/**
 * Paths that keep working while the shop is closed.
 *
 *   /admin, /api/admin  — the merchant updates stock during maintenance,
 *                         so locking these would defeat the purpose.
 *   payment webhook     — Razorpay must still be able to record payments.
 *   telegram webhook    — order-ops bot; blocking it drops notifications.
 */
function isAllowedDuringMaintenance(pathname: string): boolean {
  return (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/api/admin/") ||
    pathname === "/api/payment/webhook" ||
    pathname === "/api/telegram/webhook"
  );
}

const MAINTENANCE_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Under maintenance · Midnight Chhaya</title>
<style>
  :root { --ink:#0a0a0a; --bone:#f4f1ea; --bone-dim:#b8b3a7; --gold:#b8935a; }
  * { box-sizing: border-box; }
  html, body { height: 100%; margin: 0; }
  body {
    background: var(--ink);
    color: var(--bone);
    font-family: "Cormorant Garamond", Cormorant, Georgia, serif;
    display: flex; align-items: center; justify-content: center;
    padding: 2rem; text-align: center;
    -webkit-font-smoothing: antialiased;
  }
  /* Faint gold wash so the page doesn't read as a browser error. */
  body::before {
    content: ""; position: fixed; inset: 0; pointer-events: none;
    background: radial-gradient(ellipse at 50% 0%, rgba(184,147,90,.10), transparent 60%);
  }
  main { position: relative; max-width: 46rem; }
  .brand {
    font-family: Cinzel, Georgia, serif;
    text-transform: uppercase; letter-spacing: .35em;
    font-size: .7rem; color: var(--gold); margin: 0 0 2.5rem;
  }
  h1 {
    font-family: Cinzel, Georgia, serif;
    text-transform: uppercase; font-weight: 400;
    font-size: clamp(2rem, 8vw, 4.5rem); line-height: 1.05;
    letter-spacing: .02em; margin: 0;
  }
  .rule { width: 4rem; height: 1px; background: var(--gold); opacity: .5; margin: 2.5rem auto; }
  p { font-size: clamp(1.05rem, 3.5vw, 1.5rem); line-height: 1.6; color: var(--bone-dim); margin: .4rem 0; font-style: italic; }
  p.soon { color: var(--gold); font-style: normal; margin-top: 1.5rem; }
</style>
</head>
<body>
  <main>
    <p class="brand">Midnight Chhaya</p>
    <h1>Under maintenance</h1>
    <div class="rule"></div>
    <p>${MAINTENANCE_LINES[0]}</p>
    <p class="soon">${MAINTENANCE_LINES[1]}</p>
  </main>
</body>
</html>`;

export function proxy(req: NextRequest) {
  const url = req.nextUrl;
  const host = req.headers.get("host") ?? "";
  const { pathname } = url;

  const isPaymentWebhook =
    pathname === "/api/payment/webhook" && req.method === "POST";

  /* 1. Canonical host. The webhook is exempt — Razorpay does not follow
   *    308s on webhook POSTs, so redirecting silently fails payments. */
  if (host.endsWith(".vercel.app") || host === "www.midnightchhaya.com") {
    if (!isPaymentWebhook) {
      const redirected = new URL(
        pathname + url.search,
        `https://${CANONICAL_HOST}`
      );
      return NextResponse.redirect(redirected, 308);
    }
  }

  /* 2. Maintenance. 503 + Retry-After rather than 200, so search engines
   *    treat the store as temporarily down instead of deindexing it. */
  if (MAINTENANCE && !isAllowedDuringMaintenance(pathname)) {
    return new NextResponse(MAINTENANCE_HTML, {
      status: 503,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store, must-revalidate",
        "retry-after": "3600",
      },
    });
  }

  return NextResponse.next();
}

/* Static assets stay reachable so the holding page renders and /admin
 * keeps its JS. Everything else — pages AND api — passes through here,
 * which is what lets maintenance mode actually close the shop. */
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon|brand).*)"],
};
