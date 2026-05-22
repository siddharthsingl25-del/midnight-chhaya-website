/**
 * Shared catalog types. Used by both server data helpers and the admin
 * UI. Mirrors the `products` and `chain_options` tables in Supabase.
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
  /** Price in INR rupees. null = "Inquire". */
  price: number | null;
  shortDescription: string;
  description: string;
  materials: string[];
  dimensions: string | null;
  images: string[];
  exclusive: boolean;
  featured: boolean;
  /** Surfaced in the chains-for-women filter on the storefront. */
  forWomen: boolean;
  displayOrder: number;
};

export type ChainOption = {
  id: string;
  name: string;
  image: string;
  /** INR rupees added to the base product price. */
  priceModifier: number;
  /** Physical stock count — mirrors product inventory. 0 = sold out. */
  stock: number;
  displayOrder: number;
};

/** Format an INR price. Returns "Inquire" when price is null. */
export function formatPriceInr(price: number | null, symbol = "₹"): string {
  if (price == null) return "Inquire";
  return `${symbol}${price.toLocaleString("en-IN")}`;
}

/** Convert a DB row (snake_case columns) to a Product. */
type ProductRow = {
  slug: string;
  name: string;
  category: Category;
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

export function productFromRow(row: ProductRow): Product {
  return {
    slug: row.slug,
    name: row.name,
    category: row.category,
    price: row.price,
    shortDescription: row.short_description ?? "",
    description: row.description ?? "",
    materials: row.materials ?? [],
    dimensions: row.dimensions ?? null,
    images: row.images ?? [],
    exclusive: !!row.exclusive,
    featured: !!row.featured,
    forWomen: !!row.for_women,
    displayOrder: row.display_order ?? 0,
  };
}

type ChainRow = {
  id: string;
  name: string;
  image: string;
  price_modifier: number;
  stock: number;
  display_order: number;
};

export function chainFromRow(row: ChainRow): ChainOption {
  return {
    id: row.id,
    name: row.name,
    image: row.image,
    priceModifier: row.price_modifier ?? 0,
    stock: row.stock ?? 0,
    displayOrder: row.display_order ?? 0,
  };
}
