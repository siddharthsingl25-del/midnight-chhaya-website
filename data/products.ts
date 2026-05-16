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

export type Category = "rings" | "pendants" | "earrings" | "chokers";

export const CATEGORIES: { id: Category | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "rings", label: "Rings" },
  { id: "pendants", label: "Pendants" },
  { id: "earrings", label: "Earrings" },
  { id: "chokers", label: "Chokers" },
];

export type Product = {
  slug: string;
  name: string;
  category: Category;
  /** Price in INR (paise resolution not needed). Null = "Inquire for price". */
  price: number | null;
  shortDescription: string;
  description: string;
  materials: string[];
  dimensions?: string;
  /** First image is the card hero. */
  images: string[];
};

/* Picsum is used for placeholders. Each `?<seed>` keeps the same image stable.
 * Replace these URLs with /products/<file>.jpg once real photos arrive. */
const placeholder = (seed: string, w = 900, h = 1100) =>
  `https://picsum.photos/seed/mc-${seed}/${w}/${h}`;

export const PRODUCTS: Product[] = [
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
  {
    slug: "reliquary-pendant",
    name: "Reliquary Pendant",
    category: "pendants",
    price: 5200,
    shortDescription: "Locket of smoked glass and silver.",
    description:
      "A small reliquary on a long chain — smoked glass behind silver filigree. Carry whatever the night gives you.",
    materials: ["Sterling silver", "Smoked glass"],
    dimensions: "Pendant 28mm · chain 70cm",
    images: [placeholder("reliquary-1"), placeholder("reliquary-2")],
  },
  {
    slug: "ember-pendant",
    name: "Ember Pendant",
    category: "pendants",
    price: 3900,
    shortDescription: "Single garnet on a hammered drop.",
    description:
      "One drop of garnet caught in a hammered silver teardrop. The stone catches candlelight like an ember.",
    materials: ["Sterling silver", "Garnet"],
    images: [placeholder("ember-1"), placeholder("ember-2")],
  },
  {
    slug: "shadow-drops",
    name: "Shadow Drops",
    category: "earrings",
    price: 3400,
    shortDescription: "Asymmetric obsidian sliver earrings.",
    description:
      "Long, thin obsidian shards on hand-formed silver hooks. Slightly uneven — that's the point.",
    materials: ["Sterling silver", "Obsidian"],
    dimensions: "55mm drop",
    images: [placeholder("shadow-1"), placeholder("shadow-2")],
  },
  {
    slug: "iron-thorn-earrings",
    name: "Iron Thorn",
    category: "earrings",
    price: 2800,
    shortDescription: "Tiny blackened spike studs.",
    description:
      "Compact spike studs, blackened to the colour of forged iron. Worn alone or in stacks of three.",
    materials: ["Oxidised silver"],
    dimensions: "8mm",
    images: [placeholder("thorn-1"), placeholder("thorn-2")],
  },
  {
    slug: "midnight-choker",
    name: "Midnight Choker",
    category: "chokers",
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
    name: "Cathedral Choker",
    category: "chokers",
    price: null, // inquire-for-price piece
    shortDescription: "One-of-one — silver lattice, jet beads.",
    description:
      "A one-of-one piece: a fine silver lattice studded with antique jet beads. Made once, sold once. Inquire for current availability.",
    materials: ["Sterling silver", "Antique jet"],
    images: [placeholder("cathedral-1"), placeholder("cathedral-2")],
  },
];

export const productBySlug = (slug: string) =>
  PRODUCTS.find((p) => p.slug === slug);

export const productsByCategory = (cat: Category | "all") =>
  cat === "all" ? PRODUCTS : PRODUCTS.filter((p) => p.category === cat);

/** Featured pieces (home page). */
export const FEATURED_SLUGS = [
  "crow-talon-ring",
  "reliquary-pendant",
  "midnight-choker",
  "ember-pendant",
];

export const featured = () =>
  FEATURED_SLUGS.map(productBySlug).filter((p): p is Product => Boolean(p));
