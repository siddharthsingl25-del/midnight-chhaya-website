# Midnight Chhaya

Showcase site for **Midnight Chhaya** — handcrafted gothic jewelry. _Adornments forged in shadow._

> Currently **work-in-progress**: Phase 1 (foundation + hero) is complete. Phases 2–4 (other home sections, collections, lookbook, about, contact, polish) are in progress.

## Stack

- **Next.js 16** (App Router, TypeScript, Turbopack)
- **Tailwind CSS 4** (theme tokens via `@theme` in `app/globals.css`)
- **Framer Motion** for UI animation
- **GSAP + ScrollTrigger** for scroll narratives (added in Phase 3)
- **React Three Fiber + drei + three** for the hero particle field
- **Lenis** for smooth scrolling
- **next/font** for Cinzel + Cormorant Garamond + Inter (self-hosted, zero CLS)

## Run locally

```bash
npm install
npm run dev
# http://localhost:3000
```

```bash
npm run build && npm start
```

## Editing products

All product data lives in [`data/products.ts`](./data/products.ts). It's the single source of truth for:

- the `/collections` grid and category filters
- the `/collections/[slug]` detail pages
- the home "Featured Pieces" section (controlled by `FEATURED_SLUGS`)

To add or edit a piece:

```ts
{
  slug: "obsidian-band",          // URL: /collections/obsidian-band
  name: "Obsidian Band",
  category: "rings",              // "rings" | "pendants" | "earrings" | "chokers"
  price: 4200,                    // INR. Use `null` for "Inquire for price"
  shortDescription: "…",
  description: "…",
  materials: ["Sterling silver", "Obsidian"],
  dimensions: "Size 6 / 7 / 8",
  images: ["/products/obsidian-band-1.jpg", "/products/obsidian-band-2.jpg"],
}
```

### Swapping placeholder images for real photography

1. Drop your image files into `public/products/` (any reasonable naming — e.g. `crow-talon-1.jpg`).
2. In `data/products.ts`, replace each entry's `images: [placeholder(…), …]` with the new paths:

   ```ts
   images: ["/products/crow-talon-1.jpg", "/products/crow-talon-2.jpg"],
   ```

3. Once **all** picsum placeholders are gone, remove the `picsum.photos` entries from `next.config.ts` → `images.remotePatterns`.

## Brand assets

The logo placeholder is at [`public/brand/logo.svg`](./public/brand/logo.svg).

**To use the real logo:**

1. Save the logo as `public/brand/logo.png` (or keep `.svg`).
2. Update the references in `components/ui/Header.tsx` and the metadata block in `app/layout.tsx` from `logo.svg` → `logo.png` if you switched formats.

## Folder structure

```
app/                          (App Router pages + global styles)
  layout.tsx                  root layout: fonts, Lenis, header, cursor, grain
  page.tsx                    home
  globals.css                 design tokens + film grain
components/
  animations/                 SmoothScroll, TextReveal, …
  sections/                   Hero, FeaturedPieces, …
  three/                      HeroScene, ParticleField (R3F)
  ui/                         Header, InstagramButton, CustomCursor, FilmGrain, icons/
data/products.ts              product catalog
lib/
  animations.ts               easing + duration presets
  site.ts                     site-wide constants (brand name, Instagram URL, currency)
public/
  brand/logo.svg              brand mark (replace with real PNG)
  products/                   product photography (replace placeholders)
```

## Design system

Edit colors in `app/globals.css` `:root` — everything else (Tailwind utilities, R3F scene) reads from there.

| Token        | Value     | Use                            |
| ------------ | --------- | ------------------------------ |
| `--ink`      | `#0a0a0a` | primary background             |
| `--charcoal` | `#1a1a1a` | secondary surfaces             |
| `--bone`     | `#f4f1ea` | body text                      |
| `--bone-dim` | `#b8b3a7` | muted text                     |
| `--gold`     | `#b8935a` | CTAs, dividers, hover accents  |
| `--oxblood`  | `#5c1a1a` | accent — dusty burgundy        |
| `--smoke`    | `#2a1a3a` | atmospheric purple tint        |

Animation timings live in `lib/animations.ts`. The cinematic ease `[0.22, 1, 0.36, 1]` is the brand default — slow, decelerating, intentional.

## Deploy to Vercel

```bash
npm i -g vercel        # if not already installed
vercel                 # first time — answer prompts
vercel --prod          # production
```

Or push to GitHub and connect the repo on [vercel.com/new](https://vercel.com/new). Set:

- Framework preset: **Next.js** (auto-detected)
- Build command: `next build` (default)
- Output: `.next` (default)

No env vars needed for the showcase build.

## Future: e-commerce

The catalog is intentionally a plain TS module so the data layer can be swapped for Shopify Storefront / Razorpay / Stripe later without touching components. The `Product` type covers the fields any of those would need; price is already in INR.
