/**
 * Edge middleware.
 *
 * Job: force every visitor on the legacy vercel.app URL (or on the www.
 * subdomain) to the branded midnightchhaya.com — permanent 308 redirect,
 * preserving path + query. Runs before anything else so no other logic
 * runs on a non-canonical host.
 *
 * The Razorpay webhook is exempt from that redirect because Razorpay
 * does NOT follow 308 redirects on webhook POSTs — the handler must
 * respond 2xx in-place, otherwise every payment silently fails.
 *
 * Note: the Instagram/Facebook in-app browser used to be rewritten to
 * /lite to prevent WebView crashes. That rewrite was removed so IG
 * visitors get the full branded site. If crashes come back, restore
 * the rewrite here.
 */

import { NextResponse, type NextRequest } from "next/server";

const CANONICAL_HOST = "midnightchhaya.com";

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const host = req.headers.get("host") ?? "";

  if (host.endsWith(".vercel.app") || host === "www.midnightchhaya.com") {
    if (url.pathname === "/api/payment/webhook" && req.method === "POST") {
      return NextResponse.next();
    }
    const redirected = new URL(url.pathname + url.search, `https://${CANONICAL_HOST}`);
    return NextResponse.redirect(redirected, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon|brand|api).*)"],
};
