/**
 * Edge middleware.
 *
 * Two jobs:
 *   1. Force every visitor on the legacy vercel.app URL to the branded
 *      midnightchhaya.com — permanent 308 redirect, keeps SEO and any
 *      stored bookmarks working.
 *   2. Detects Instagram / Facebook in-app browsers on the homepage
 *      and rewrites their request to /lite — a static, JS-free page
 *      that never crashes those flaky WebViews.
 */

import { NextResponse, type NextRequest } from "next/server";

const META_UA = /Instagram|FBAN|FBAV|FB_IAB/i;
const CANONICAL_HOST = "midnightchhaya.com";

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const host = req.headers.get("host") ?? "";

  // 1. Legacy vercel.app URL → force-redirect to the branded domain,
  //    preserving path + query. Runs before any other logic.
  if (host.endsWith(".vercel.app") || host === "www.midnightchhaya.com") {
    const redirected = new URL(url.pathname + url.search, `https://${CANONICAL_HOST}`);
    return NextResponse.redirect(redirected, 308);
  }

  // 2. Instagram/FB in-app browsers hitting the homepage → serve /lite.
  if (url.pathname === "/") {
    const ua = req.headers.get("user-agent") ?? "";
    if (META_UA.test(ua)) {
      const rewritten = req.nextUrl.clone();
      rewritten.pathname = "/lite";
      return NextResponse.rewrite(rewritten);
    }
  }

  return NextResponse.next();
}

export const config = {
  // Match everything except Next internals + static assets so both
  // the vercel.app→branded redirect and the homepage in-app rewrite
  // catch the traffic they need to.
  matcher: ["/((?!_next/static|_next/image|favicon|brand|api).*)"],
};
