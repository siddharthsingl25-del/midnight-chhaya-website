/**
 * Site-wide constants. Edit here, not in components.
 */
export const SITE = {
  name: "Midnight Chhaya",
  tagline: "Adornments forged in shadow.",
  description:
    "Handcrafted gothic jewelry — chains, keychains, bracelets and rings, born in shadow and finished by hand.",
  url: "https://midnightchhaya.com",
  instagram: "https://www.instagram.com/midnight_chhaya/",
  instagramHandle: "@midnight_chhaya",
  /** ntfy.sh push-notification topic — install the ntfy app on your phone
   * and subscribe to this topic. New orders ping it instantly. */
  notifyTopic: "mc-orders-ca56afb850fc2d37",
  currency: { code: "INR", symbol: "₹" },
  /** Logo file. Transparent PNG, sits cleanly on any background. */
  logoPath: "/brand/logo.png",
  /** Intrinsic logo aspect (width / height). */
  logoAspect: 776 / 321,
} as const;

/**
 * Live promotional offer. When `deadline` is in the future:
 *   • A countdown banner renders at the top of every page.
 *   • The cart and server-side checkout auto-apply the BOGO discount
 *     to any line whose slug includes one of `slugMatches`.
 * Set deadline to a past date OR clear the file to disable.
 *
 * Discount rule: for every TWO qualifying units in the cart, the
 * CHEAPER one is free. floor(N/2) freebies, picked as the cheapest.
 */
export const ACTIVE_OFFER = {
  title: "BUY 1 GET 1 FREE",
  subtitle: "Mini Red Bull Charm",
  /** ISO timestamp — 11:59 PM IST 10 June 2026 = 18:29 UTC 10 June 2026 */
  deadlineIso: "2026-06-10T18:29:00.000Z",
  /** Slug substrings (lowercase) — a line is eligible if its slug
   *  contains any of these. */
  slugMatches: ["mini-red-bull"],
} as const;

/** Has the offer expired? Compares against the supplied time (defaults
 *  to now). Server- and client-safe. */
export function offerActiveAt(now: number = Date.now()): boolean {
  return now < new Date(ACTIVE_OFFER.deadlineIso).getTime();
}

/** Compute the BOGO discount amount in rupees for a set of cart lines.
 * Each line carries an `eligible` flag (true if its slug matches the
 * offer) and a `unitPrice` × `qty`. We flatten to per-unit prices,
 * sort ascending, and zero out floor(N/2) of the cheapest. */
export function computeBogoDiscount(
  lines: { eligible: boolean; unitPrice: number; qty: number }[]
): number {
  const units: number[] = [];
  for (const l of lines) {
    if (!l.eligible) continue;
    for (let i = 0; i < l.qty; i++) units.push(l.unitPrice);
  }
  if (units.length < 2) return 0;
  units.sort((a, b) => a - b);
  const freebies = Math.floor(units.length / 2);
  let total = 0;
  for (let i = 0; i < freebies; i++) total += units[i];
  return total;
}

/** Top-of-page navigation. Items can have `children` for hover dropdowns. */
export type NavItem = {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
};

export const NAV: readonly NavItem[] = [
  { label: "Shop All",  href: "/collections" },
  { label: "Chains",    href: "/collections?cat=chains" },
  { label: "Keychains", href: "/collections?cat=keychains" },
  { label: "Earbuds",   href: "/collections?cat=earbuds" },
  { label: "Glasses",   href: "/collections?cat=glasses" },
  { label: "Rings",     href: "/collections?cat=rings" },
];

/** Footer navigation (richer than the header — includes brand/story pages). */
export const FOOTER_NAV: readonly { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "Shop",
    links: [
      { label: "All pieces",   href: "/collections" },
      { label: "Chains",       href: "/collections?cat=chains" },
      { label: "Keychains",    href: "/collections?cat=keychains" },
      { label: "Bracelets",    href: "/collections?cat=bracelets" },
      { label: "Rings",        href: "/collections?cat=rings" },
    ],
  },
  {
    heading: "Story",
    links: [
      { label: "About",    href: "/about" },
      { label: "Reviews",  href: "/reviews" },
      { label: "Contact",  href: "/contact" },
    ],
  },
  {
    heading: "Policies",
    links: [
      { label: "Privacy policy",         href: "/privacy" },
      { label: "Shipping policy",        href: "/shipping" },
      { label: "Returns & replacements", href: "/returns" },
    ],
  },
];

/** Format an INR price. Returns "Inquire" when price is null. */
export function formatPrice(price: number | null): string {
  if (price == null) return "Inquire";
  return `${SITE.currency.symbol}${price.toLocaleString("en-IN")}`;
}

/** Shipping is free above this subtotal threshold (INR). */
export const SHIPPING_THRESHOLD = 999;
/** Flat shipping fee when subtotal is below the threshold (INR). */
export const SHIPPING_FEE = 60;

/** Shipping fee for a given subtotal. 0 once the threshold is met. */
export function computeShipping(subtotal: number): number {
  return subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
}

/** Default packaging cost the merchant absorbs on every order (box,
 * bubble wrap, thank-you card, etc). Auto-subtracted from each order's
 * profit in the finance dashboard. Change this number if your real
 * average packaging cost differs. */
export const PACKAGING_COST_PER_ORDER = 12.5;

/** Flat cash-on-delivery charge added to the customer's total when they
 * pick COD. The customer prepays this + shipping via Razorpay; the
 * product subtotal is paid in cash to the courier on delivery. Cover
 * fake orders + courier's COD collection fee. */
export const COD_CHARGE = 250;

/** Default courier cost the merchant pays out per order, keyed by
 * payment method. Used in the Finance dashboard when the per-order
 * merchant_cost column is null (i.e. you didn't run /ship on it):
 *   - online: customer paid ₹60 shipping revenue, the courier bill
 *             matches, so profit nets out to zero on shipping.
 *   - cod:    higher because the courier's COD collection fee stacks
 *             on top of the plain courier charge.
 * If you actually /ship <order> <amount>, that number wins. */
export const DEFAULT_COURIER_COST = {
  online: 60,
  cod: 250,
} as const;

/** Expense categories that affect net profit. The other categories
 * (restock, shipping, packaging) are tracking-only:
 *   - restock = buying inventory; the cost flows in via COGS per unit
 *     when those products sell. Counting it again here would double-count.
 *   - shipping = courier cost; logged per-order via /ship, so already
 *     subtracted from each order's profit.
 *   - packaging = handled per-order via PACKAGING_COST_PER_ORDER.
 * Bulk entries in those categories are still shown in the dashboard so
 * you can see total spend, just not subtracted from net profit. */
export const OPERATING_EXPENSE_CATEGORIES = [
  "advertising",
  "collab",
  "other",
] as const;
