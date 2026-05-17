/**
 * Product catalog. Single source of truth for the showcase.
 *
 * Swap placeholders for real photography by:
 *   1. Dropping images into /public/products/ (e.g. crow-talon.jpg, crow-talon-2.jpg)
 *   2. Updating the `images` array below
 *   3. (Optional) Editing the rest of the fields per piece
 *
 * Currency is INR throughout (see lib/site.ts).
 */

export type Category = "rings" | "chains" | "keychains" | "bracelets";

export const CATEGORIES: { id: Category | "all"; label: string }[] = [
  { id: "all",        label: "All" },
  { id: "chains",     label: "Chains" },
  { id: "keychains",  label: "Keychains" },
  { id: "bracelets",  label: "Bracelets" },
  { id: "rings",      label: "Rings" },
];

export type Product = {
  slug: string;
  name: string;
  category: Category;
  /** Price in INR. Null = "Inquire for price". */
  price: number | null;
  shortDescription: string;
  description: string;
  materials: string[];
  dimensions?: string;
  /** First image is the card hero. */
  images: string[];
  /** Marks a piece for the Exclusives page (one-of-one or limited). */
  exclusive?: boolean;
};

const placeholder = (seed: string, w = 900, h = 1100) =>
  `https://picsum.photos/seed/mc-${seed}/${w}/${h}`;

export const PRODUCTS: Product[] = [
  // —— Rings ——
  {
    slug: "crow-talon-ring",
    name: "Crow Talon Ring",
    category: "rings",
    price: 4800,
    shortDescription: "Hand-forged silver, blackened.",
    description:
      "A talon coiled around the finger — cast in solid sterling silver, oxidised to deep slate, then polished only at the high points. Wear it as a relic.",
    materials: ["Oxidised sterling silver"],
    dimensions: "Adjustable, fits sizes 5–9",
    images: [placeholder("talon-1"), placeholder("talon-2"), placeholder("talon-3")],
  },
  {
    slug: "vesper-signet",
    name: "Vesper Signet",
    category: "rings",
    price: 6400,
    shortDescription: "Onyx set in antique brass.",
    description:
      "An evening-hour signet — flat onyx face on a brass band aged with patina. Heavy in the hand, quiet on the eye.",
    materials: ["Brass", "Black onyx"],
    dimensions: "Size 6 / 7 / 8",
    images: [placeholder("vesper-1"), placeholder("vesper-2")],
  },

  // —— Chains ——
  {
    slug: "reliquary-pendant",
    name: "Reliquary Chain",
    category: "chains",
    price: 5200,
    shortDescription: "Locket of smoked glass on silver.",
    description:
      "A small reliquary on a long chain — smoked glass behind silver filigree. Carry whatever the night gives you.",
    materials: ["Sterling silver", "Smoked glass"],
    dimensions: "Pendant 28mm · chain 70cm",
    images: [placeholder("reliquary-1"), placeholder("reliquary-2")],
  },
  {
    slug: "ember-pendant",
    name: "Ember Drop Chain",
    category: "chains",
    price: 3900,
    shortDescription: "Single garnet on a hammered drop.",
    description:
      "One drop of garnet caught in a hammered silver teardrop. The stone catches candlelight like an ember.",
    materials: ["Sterling silver", "Garnet"],
    images: [placeholder("ember-1"), placeholder("ember-2")],
  },
  {
    slug: "midnight-choker",
    name: "Midnight Choker",
    category: "chains",
    price: 7200,
    shortDescription: "Velvet ribbon, antique gold clasp.",
    description:
      "Deep black velvet finished with a brass clasp inspired by Victorian mourning jewellery. A cameo of darkness at the throat.",
    materials: ["Velvet", "Brass"],
    dimensions: "Adjustable 32–40cm",
    images: [placeholder("choker-1", 900, 900), placeholder("choker-2", 900, 900)],
  },
  {
    slug: "cathedral-choker",
    name: "Cathedral Chain",
    category: "chains",
    price: null, // one-of-one
    shortDescription: "One-of-one — silver lattice, jet beads.",
    description:
      "A one-of-one piece: a fine silver lattice studded with antique jet beads. Made once, sold once. Inquire for current availability.",
    materials: ["Sterling silver", "Antique jet"],
    images: [placeholder("cathedral-1"), placeholder("cathedral-2")],
    exclusive: true,
  },

  // —— Bracelets ——
  {
    slug: "wraith-cuff",
    name: "Wraith Cuff",
    category: "bracelets",
    price: 5400,
    shortDescription: "Hand-hammered oxidised cuff.",
    description:
      "A heavy hand-hammered cuff in oxidised silver — pulled open just enough to slip on, then closes against the wrist with a soft, deliberate weight.",
    materials: ["Oxidised sterling silver"],
    dimensions: "Inner Ø 60mm, adjustable",
    images: [placeholder("wraith-1"), placeholder("wraith-2")],
  },
  {
    slug: "shadow-wrap-bracelet",
    name: "Shadow Wrap",
    category: "bracelets",
    price: 3600,
    shortDescription: "Black cord wrap with brass charm.",
    description:
      "Triple-wrap waxed cord with a small brass medallion, aged to a deep gold-brown. Slim, quiet, made for everyday.",
    materials: ["Waxed cotton cord", "Aged brass"],
    dimensions: "Wraps 3× · adjustable 14–18cm",
    images: [placeholder("shadow-w-1"), placeholder("shadow-w-2")],
  },

  // —— Keychains ——
  {
    slug: "iron-thorn-keychain",
    name: "Iron Thorn Keychain",
    category: "keychains",
    price: 1800,
    shortDescription: "Blackened spike on a brass ring.",
    description:
      "A single blackened spike on a heavy brass ring — small, sharp, satisfying in the pocket. Hand-finished one by one.",
    materials: ["Oxidised silver", "Brass"],
    dimensions: "Spike 40mm · ring Ø 32mm",
    images: [placeholder("thorn-k-1"), placeholder("thorn-k-2")],
  },
  {
    slug: "relic-keychain",
    name: "Relic Keychain",
    category: "keychains",
    price: 2200,
    shortDescription: "Engraved tag on antique brass.",
    description:
      "A small engraved brass tag — a single word, your choice, hand-stamped at the bench. Sold in small batches.",
    materials: ["Antique brass"],
    dimensions: "Tag 22 × 36mm",
    images: [placeholder("relic-k-1"), placeholder("relic-k-2")],
    exclusive: true,
  },
];

export const productBySlug = (slug: string) =>
  PRODUCTS.find((p) => p.slug === slug);

export const productsByCategory = (cat: Category | "all") =>
  cat === "all" ? PRODUCTS : PRODUCTS.filter((p) => p.category === cat);

export const exclusiveProducts = () =>
  PRODUCTS.filter((p) => p.exclusive);

/** Featured pieces (home page). */
export const FEATURED_SLUGS = [
  "crow-talon-ring",
  "reliquary-pendant",
  "midnight-choker",
  "ember-pendant",
];

export const featured = () =>
  FEATURED_SLUGS.map(productBySlug).filter((p): p is Product => Boolean(p));
