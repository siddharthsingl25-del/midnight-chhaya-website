# Midnight Chhaya

Showcase site for **Midnight Chhaya** — handcrafted gothic jewelry. _Adornments forged in shadow._

A dark, editorial, Pinterest-mood Next.js site. No e-commerce yet (everything routes to Instagram DMs for inquiries) but the data layer is structured so Shopify / Razorpay / Stripe can be added later without rewriting components.

## Pages

| Route                       | What it is                                                              |
| --------------------------- | ----------------------------------------------------------------------- |
| `/`                         | Hero (photo + ash + droplets, "ghost" reveal), Featured, Brand teaser, Lookbook preview, Instagram CTA, Footer |
| `/collections`              | Filterable grid (rings · pendants · earrings · chokers · all)           |
| `/collections/[slug]`       | Product detail — large image, info, "Inquire on Instagram", related    |
| `/lookbook`                 | Pinterest masonry gallery with parallax + lightbox                      |
| `/about`                    | Pinned scroll narrative (4 beats with sticky atmospheric images)       |
| `/contact`                  | Inquiry form + direct email + Instagram CTA                             |
| `/sitemap.xml`, `/robots.txt` | Generated automatically by `app/sitemap.ts` and `app/robots.ts`       |

## Stack

- **Next.js 16** (App Router, TypeScript, Turbopack)
- **Tailwind CSS 4** — tokens via `@theme` in `app/globals.css`
- **Framer Motion** — reveals, hover micro-interactions, page transitions, magnetic CTAs
- **React Three Fiber + three** — drifting white-ash particle shader in the hero
- **Lenis** — smooth scrolling (`lerp: 0.08` for that heavy, deliberate feel)
- **next/font** — Cinzel · Cormorant Garamond · Inter (self-hosted, zero CLS)
- **lucide-react** for non-brand icons; we ship an inline Instagram SVG (lucide 1.x dropped brand icons)

## Run locally

```bash
npm install
npm run dev    # http://localhost:3000
```

```bash
npm run build && npm start
```

## Editing products

All product data lives in [`data/products.ts`](./data/products.ts) — single source of truth for the grid, filters, detail pages, and home "Featured" section (controlled by `FEATURED_SLUGS`).

```ts
{
  slug: "obsidian-band",          // URL: /collections/obsidian-band
  name: "Obsidian Band",
  category: "rings",              // "rings" | "pendants" | "earrings" | "chokers"
  price: 4200,                    // INR. null → "Inquire for price"
  shortDescription: "…",
  description: "…",
  materials: ["Sterling silver", "Obsidian"],
  dimensions: "Size 6 / 7 / 8",
  images: ["/products/obsidian-band-1.jpg", "/products/obsidian-band-2.jpg"],
}
```

### Swapping placeholder images for real photography

Placeholders use `picsum.photos`. To use real images:

1. Drop image files into `public/products/` (any reasonable naming).
2. In `data/products.ts`, replace each entry's `images: [placeholder(…), …]` with the new paths:
   ```ts
   images: ["/products/crow-talon-1.jpg", "/products/crow-talon-2.jpg"],
   ```
3. Once **all** picsum placeholders are gone, remove `picsum.photos` from `next.config.ts → images.remotePatterns`.

Lookbook images live in [`data/lookbook.ts`](./data/lookbook.ts) and follow the same pattern (drop into `public/lookbook/`).

## Brand assets

The logo is a styled SVG monogram placeholder at [`public/brand/logo.svg`](./public/brand/logo.svg). The original `i.ibb.co` URL is blocked in some sandboxed environments, which is why we shipped a placeholder.

**To use the real logo:**

1. Save your logo (PNG, SVG, whatever) into `public/brand/logo.png` (or any filename).
2. Change one line in [`lib/site.ts`](./lib/site.ts):
   ```ts
   logoPath: "/brand/logo.png",
   ```
   That constant is consumed by the header, footer, favicon, and OG metadata — one line covers everything.

The hero backdrop image is also a placeholder. Swap it by editing `HERO_IMAGE` in [`components/sections/HeroBackground.tsx`](./components/sections/HeroBackground.tsx).

## Hero animation

The hero is built from three layers:

1. **Photographic backdrop** — desaturated, brightness ~45%, slow Ken-Burns scale over 28s
2. **Atmosphere** ([`components/three/HeroAtmosphere.tsx`](./components/three/HeroAtmosphere.tsx)) — R3F particle shader (`AshField`) for drifting white powder, plus CSS-only vertical water-droplet streaks
3. **"Ghost" reveal** ([`app/globals.css`](./app/globals.css) `.ghost-in` keyframes) — headline + tagline snap into existence with a brief bright-blurred flash that resolves into bone-white, instead of a gradual fade

Tune the ash drift speed (`AshField.tsx` → `drift` prop), droplet density (`HeroAtmosphere.tsx` → `droplets` array length), or ghost-flash timing (`globals.css` → `.ghost-in` keyframes).

## Folder structure

```
app/
  layout.tsx                   root: fonts, Lenis, header, cursor, grain
  template.tsx                 per-navigation entry animation
  page.tsx                     home
  globals.css                  design tokens, film grain, droplet + ghost keyframes
  collections/                 grid, dynamic [slug] detail pages
  lookbook/                    masonry + lightbox
  about/                       pinned scroll narrative
  contact/                     inquiry form + side rail
  sitemap.ts · robots.ts · not-found.tsx
components/
  animations/                  SmoothScroll, TextReveal, Reveal (scroll fade)
  sections/                    Hero, HeroBackground, FeaturedPieces, BrandTeaser, LookbookPreview, InstagramCTA, PageHeader
  three/                       AshField (R3F shader), HeroAtmosphere (Canvas + droplets)
  ui/                          Header, Footer, ProductCard, CustomCursor, FilmGrain, InstagramButton, icons/, SectionHeading
data/
  products.ts                  catalog (single source of truth)
  lookbook.ts                  lookbook images
  about.ts                     about-page narrative beats
lib/
  animations.ts                easing + duration presets
  site.ts                      brand constants (name, IG, currency, logoPath)
  useMagnetic.ts               hover hook for primary CTAs
public/
  brand/logo.svg               brand mark (replace per "Brand assets" above)
  products/                    real product photography (placeholder via picsum for now)
```

## Design system

Edit colors in `app/globals.css` `:root` — Tailwind utilities and the R3F shader colors both read from there.

| Token        | Value     | Use                            |
| ------------ | --------- | ------------------------------ |
| `--ink`      | `#0a0a0a` | primary background             |
| `--charcoal` | `#1a1a1a` | secondary surfaces             |
| `--bone`     | `#f4f1ea` | body text                      |
| `--bone-dim` | `#b8b3a7` | muted text                     |
| `--gold`     | `#b8935a` | CTAs, dividers, hover accents  |
| `--oxblood`  | `#5c1a1a` | accent — dusty burgundy        |
| `--smoke`    | `#2a1a3a` | atmospheric purple tint        |

Animation timings live in [`lib/animations.ts`](./lib/animations.ts). The cinematic ease `[0.22, 1, 0.36, 1]` is the brand default — slow, decelerating, intentional.

## Cursor

A small antique-gold cursor follows the pointer on desktop. Any element with `data-cursor="<label>"` makes the cursor grow + display that label on hover. Hidden on touch devices and `prefers-reduced-motion` users.

## Form submissions

`app/contact/InquiryForm.tsx` is currently UI-only — it shows a "Received" confirmation after a fake delay. Wire it to your backend by replacing the `await new Promise(...)` line with a real request (e.g. `fetch('/api/contact', ...)` or a Formspree / Resend endpoint).

## Deploy to Vercel

The repo is already optimised for Vercel.

```bash
npm i -g vercel
vercel             # first time — answer prompts
vercel --prod
```

Or push to GitHub and import on [vercel.com/new](https://vercel.com/new). Framework preset auto-detects as **Next.js**; leave all defaults. No env vars needed.

## Performance + accessibility

- All images use `next/image` with explicit `sizes` (responsive sourcesets, automatic AVIF/WebP)
- Particle count + DPR cap drop on small viewports
- `prefers-reduced-motion`: animations + film grain stop, custom cursor disabled, smooth-scroll bypassed
- Self-hosted fonts via `next/font` (zero CLS, no external requests at runtime)
- All pages prerendered at build time (`SSG`) — instant first paint after edge cache

## Future: e-commerce

Product data is a plain TypeScript module so the data layer can be swapped for Shopify Storefront / Razorpay / Stripe without touching components. The `Product` type covers the fields any of those need; price is already in INR.
