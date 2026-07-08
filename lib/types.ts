/**
 * Shared catalog types. Used by both server data helpers and the admin
 * UI. Mirrors the `products` and `chain_options` tables in Supabase.
 */

export type Category = "rings" | "chains" | "keychains" | "bracelets" | "earbuds";

export const CATEGORIES: { id: Category | "all"; label: string }[] = [
  { id: "all",        label: "All" },
  { id: "chains",     label: "Chains" },
  { id: "keychains",  label: "Keychains" },
  { id: "earbuds",    label: "Chrome Earbuds" },
  { id: "bracelets",  label: "Bracelets" },
  { id: "rings",      label: "Rings" },
];

export type Product = {
  slug: string;
  name: string;
  category: Category;
  /** Price in INR rupees. null = "Inquire". */
  price: number | null;
  /** What this unit costs the merchant to source / make (COGS), in INR
   * rupees. Null = not set yet (profit can't be computed). Admin-only. */
  costPrice: number | null;
  shortDescription: string;
  description: string;
  materials: string[];
  dimensions: string | null;
  images: string[];
  exclusive: boolean;
  featured: boolean;
  /** Surfaced in the chains-for-women filter on the storefront. */
  forWomen: boolean;
  /** Which variant picker (if any) to show on the product detail page.
   * null = no picker. */
  variantKind: "chain" | "car" | null;
  /** Optional short text overlay on the product card (e.g. "NEW", "BEST SELLER"). */
  badgeText: string | null;
  /** Optional image overlay (URL) — takes precedence over badgeText. */
  badgeImage: string | null;
  /** Manual "related products" override — slugs shown in the Related
   * Pieces section at the bottom of the detail page. Empty = fall back
   * to automatic category siblings. */
  relatedSlugs: string[];
  /** Pre-order flag. When true, the product surfaces in the homepage
   * pre-order section with a badge, and its price appears next to a
   * struck-through launchPrice for reference. */
  isPreOrder: boolean;
  /** The eventual full price after launch, shown crossed-out beside the
   * current price during the pre-order phase. Null when not applicable. */
  launchPrice: number | null;
  displayOrder: number;
};

export type ChainOption = {
  id: string;
  name: string;
  image: string;
  /** INR rupees added to the base product price. */
  priceModifier: number;
  /** What this chain/car unit costs the merchant to source. Null = not
   * set yet (chain cost will be skipped in profit calc). */
  costPrice: number | null;
  /** Physical stock count — mirrors product inventory. 0 = sold out. */
  stock: number;
  /** Variant kind. Chains attach to necklaces, cars to keychains. */
  kind: "chain" | "car";
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
  cost_price: number | null;
  short_description: string;
  description: string;
  materials: string[];
  dimensions: string | null;
  images: string[];
  exclusive: boolean;
  featured: boolean;
  for_women: boolean;
  variant_kind: string | null;
  badge_text: string | null;
  badge_image: string | null;
  related_slugs: string[] | null;
  is_pre_order: boolean | null;
  launch_price: number | null;
  display_order: number;
};

export function productFromRow(row: ProductRow): Product {
  return {
    slug: row.slug,
    name: row.name,
    category: row.category,
    price: row.price,
    costPrice: row.cost_price ?? null,
    shortDescription: row.short_description ?? "",
    description: row.description ?? "",
    materials: row.materials ?? [],
    dimensions: row.dimensions ?? null,
    images: row.images ?? [],
    exclusive: !!row.exclusive,
    featured: !!row.featured,
    forWomen: !!row.for_women,
    variantKind:
      row.variant_kind === "chain" || row.variant_kind === "car"
        ? row.variant_kind
        : null,
    badgeText: row.badge_text?.trim() || null,
    badgeImage: row.badge_image?.trim() || null,
    relatedSlugs: Array.isArray(row.related_slugs) ? row.related_slugs : [],
    isPreOrder: !!row.is_pre_order,
    launchPrice:
      typeof row.launch_price === "number" && row.launch_price >= 0
        ? row.launch_price
        : null,
    displayOrder: row.display_order ?? 0,
  };
}

type ChainRow = {
  id: string;
  name: string;
  image: string;
  price_modifier: number;
  cost_price: number | null;
  stock: number;
  kind: string;
  display_order: number;
};

export function chainFromRow(row: ChainRow): ChainOption {
  return {
    id: row.id,
    name: row.name,
    image: row.image,
    priceModifier: row.price_modifier ?? 0,
    costPrice: row.cost_price ?? null,
    stock: row.stock ?? 0,
    kind: row.kind === "car" ? "car" : "chain",
    displayOrder: row.display_order ?? 0,
  };
}

/* ─── Finance types ──────────────────────────────────────────────────── */

export const EXPENSE_CATEGORIES = [
  "advertising",
  "collab",
  "restock",
  "shipping",
  "packaging",
  "other",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  advertising: "Advertising",
  collab: "Collab / Influencer",
  restock: "Restock / Raw materials",
  shipping: "Shipping",
  packaging: "Packaging",
  other: "Other",
};

export type Expense = {
  id: number;
  category: ExpenseCategory;
  amount: number;
  description: string;
  occurredAt: string;
  createdAt: string;
};

/* ─── Reviews ────────────────────────────────────────────────────────── */

export type Review = {
  id: number;
  imageUrl: string;
  displayOrder: number;
  createdAt: string;
};
