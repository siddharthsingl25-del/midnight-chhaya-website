/**
 * Auto-synced product seeds.
 *
 * Products I add for the merchant via chat live here as TypeScript
 * data. On every deploy, lib/seed-runner.ts upserts each entry into
 * Supabase (preserving any edits the merchant later makes in /admin).
 *
 * Append to this array — never edit an existing entry in place. If
 * the merchant wants something changed about an existing product,
 * tell them to edit it in /admin → Products instead of touching this
 * file (their edits would be wiped on the next sync).
 *
 * Schema mirrors public.products columns exactly (snake_case).
 */

export type SeedProduct = {
  slug: string;
  name: string;
  category: "rings" | "chains" | "keychains" | "bracelets";
  price: number | null;
  short_description: string;
  description: string;
  materials: string[];
  dimensions: string | null;
  images: string[];
  exclusive: boolean;
  featured: boolean;
  for_women: boolean;
  display_order: number;
};

export const SEED_PRODUCTS: SeedProduct[] = [
  {
    slug: "dangle-white-flower",
    name: "Dangle White Flower",
    category: "chains",
    price: 300,
    short_description: "Clear quartz rose on a silver thorn stem.",
    description:
      "A translucent quartz rose perched on a slim silver stem of twisting thorns and leaves — softness held against sharpness. Worn long; reads delicate from a distance, gothic up close.",
    materials: ["Silver-tone alloy", "Clear quartz"],
    dimensions: null,
    images: ["/products/dangle-white-flower-1.webp"],
    exclusive: false,
    featured: false,
    for_women: true,
    display_order: 99,
  },
  {
    slug: "dangle-pink-flower",
    name: "Dangle Pink Flower",
    category: "chains",
    price: 300,
    short_description: "Soft pink rose on a silver thorn stem.",
    description:
      "A blush pink resin rose perched on a slim silver stem of twisting thorns and leaves — softness held against sharpness. Sister piece to the clear-quartz version; reads delicate from a distance, gothic up close.",
    materials: ["Silver-tone alloy", "Pink resin"],
    dimensions: null,
    images: ["/products/dangle-pink-flower-1.webp"],
    exclusive: false,
    featured: false,
    for_women: true,
    display_order: 100,
  },
  {
    slug: "white-moon-bling",
    name: "White Moon Bling",
    category: "chains",
    price: 300,
    short_description: "Pavé crescent moon with three falling stars.",
    description:
      "A mother-of-pearl crescent rimmed in tiny clear crystals, with three slim chains of stars and rhinestones falling beneath like a meteor shower frozen mid-air. Delicate, dressy, made to catch lamplight.",
    materials: ["Silver-tone alloy", "Mother-of-pearl", "Clear crystals"],
    dimensions: null,
    images: ["/products/white-moon-bling-1.webp"],
    exclusive: false,
    featured: false,
    for_women: true,
    display_order: 101,
  },
];
