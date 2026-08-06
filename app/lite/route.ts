/**
 * GET /lite
 *
 * A Route Handler returning pure static HTML — no React runtime, no
 * client providers, no scripts. Middleware rewrites Instagram /
 * Facebook in-app browser requests here so their flaky WebViews get
 * something they can actually render without crashing.
 *
 * Content: brand logo, a note, one clear "Shop All" CTA, and a small
 * category list. Every link is a plain <a href> — no framer motion,
 * no Next Image, no client hydration.
 *
 * The full site still works normally for these users if they
 * navigate to /collections themselves; only the / rewrite is scoped
 * to their user-agent.
 */

import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

const CATEGORIES: readonly { label: string; href: string }[] = [
  { label: "Chains",    href: "/collections?cat=chains" },
  { label: "Keychains", href: "/collections?cat=keychains" },
  { label: "Rings",     href: "/collections?cat=rings" },
  { label: "Bracelets", href: "/collections?cat=bracelets" },
  { label: "Glasses",   href: "/collections?cat=glasses" },
  { label: "Earbuds",   href: "/collections?cat=earbuds" },
  { label: "Wallets",   href: "/collections?cat=wallets" },
];

export async function GET() {
  const catLinks = CATEGORIES.map(
    (c) => `<li><a href="${c.href}">${c.label}</a></li>`
  ).join("");

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${SITE.name} — ${SITE.tagline}</title>
  <meta name="description" content="${SITE.description}" />
  <meta name="theme-color" content="#0a0a0a" />
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    html,body{background:#0a0a0a;color:#f0ead6;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;min-height:100vh}
    a{color:inherit;text-decoration:none}
    .wrap{max-width:520px;margin:0 auto;padding:32px 24px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:24px}
    .logo{width:80%;max-width:360px;height:auto;margin:24px 0 8px}
    h1{font-family:"Times New Roman",serif;font-size:20px;font-weight:400;letter-spacing:0.15em;text-transform:uppercase;color:#f0ead6;margin-bottom:4px}
    p.tag{font-family:"Times New Roman",serif;font-style:italic;color:#a8a29e;font-size:15px;margin-bottom:16px}
    .shop-btn{display:block;width:100%;padding:16px 24px;background:#b8935a;color:#0a0a0a;font-size:12px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;text-align:center;border:none}
    .divider{width:100%;height:1px;background:rgba(240,234,214,0.15);margin:16px 0 8px}
    .heading{font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:#a8a29e}
    ul.cats{list-style:none;width:100%;display:grid;grid-template-columns:1fr 1fr;gap:8px}
    ul.cats li a{display:block;padding:14px 12px;border:1px solid rgba(240,234,214,0.2);font-size:13px;letter-spacing:0.15em;text-transform:uppercase;text-align:center;color:#f0ead6}
    .ig{display:inline-flex;align-items:center;gap:8px;color:#b8935a;font-size:13px;margin-top:8px}
    .foot{font-size:11px;color:#78716c;margin-top:32px;padding-bottom:32px}
    .foot a{color:#b8935a;text-decoration:underline}
  </style>
</head>
<body>
  <div class="wrap">
    <img class="logo" src="${SITE.logoPath}" alt="${SITE.name}" width="360" height="149" />
    <h1>${SITE.name}</h1>
    <p class="tag">${SITE.tagline}</p>

    <a class="shop-btn" href="/collections">Shop All Pieces →</a>

    <div class="divider"></div>
    <p class="heading">Categories</p>
    <ul class="cats">
      ${catLinks}
    </ul>

    <a class="ig" href="${SITE.instagram}">📷 Follow ${SITE.instagramHandle}</a>

    <p class="foot">
      Having trouble? Tap the ⋯ menu in Instagram and choose
      <strong>"Open in browser"</strong>, or copy
      <a href="${SITE.url}">midnightchhaya.com</a> into Chrome/Safari for
      the full experience.
    </p>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Short cache so we can iterate quickly without CDN sticking.
      "Cache-Control": "public, max-age=60, s-maxage=60",
    },
  });
}
