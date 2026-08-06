/**
 * Edge middleware.
 *
 * Detects Instagram / Facebook in-app browsers by User-Agent and
 * rewrites their homepage request to /lite — a static, JS-free page
 * that never crashes those flaky WebViews.
 *
 * We only rewrite the homepage. Deeper routes (/collections, /checkout,
 * /admin) still get the full app because customers who navigate past
 * the home page have already committed and the WebView usually can
 * survive a single interactive page.
 */

import { NextResponse, type NextRequest } from "next/server";

const META_UA = /Instagram|FBAN|FBAV|FB_IAB/i;

export function middleware(req: NextRequest) {
  const url = req.nextUrl;

  // Only intercept the homepage (root) — leave everything else alone.
  if (url.pathname !== "/") return NextResponse.next();

  const ua = req.headers.get("user-agent") ?? "";
  if (!META_UA.test(ua)) return NextResponse.next();

  // Avoid rewrite loops — /lite must serve itself.
  if (url.pathname.startsWith("/lite")) return NextResponse.next();

  const rewritten = req.nextUrl.clone();
  rewritten.pathname = "/lite";
  return NextResponse.rewrite(rewritten);
}

export const config = {
  matcher: ["/"],
};
