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
  currency: { code: "INR", symbol: "₹" },
  /** Logo file. Transparent PNG, sits cleanly on any background. */
  logoPath: "/brand/logo.png",
  /** Intrinsic logo aspect (width / height). */
  logoAspect: 776 / 321,
} as const;

/** Top-of-page navigation. Items can have `children` for hover dropdowns. */
export type NavItem = {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
};

export const NAV: readonly NavItem[] = [
  {
    label: "Collections",
    href: "/collections",
    children: [
      { label: "Chains",    href: "/collections?cat=chains" },
      { label: "Keychains", href: "/collections?cat=keychains" },
      { label: "Bracelets", href: "/collections?cat=bracelets" },
      { label: "Rings",     href: "/collections?cat=rings" },
    ],
  },
  { label: "Exclusives", href: "/exclusives" },
  { label: "Privacy",    href: "/privacy" },
  { label: "Shipping",   href: "/shipping" },
  { label: "Returns",    href: "/returns" },
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
      { label: "Exclusives",   href: "/exclusives" },
    ],
  },
  {
    heading: "Story",
    links: [
      { label: "About",    href: "/about" },
      { label: "Lookbook", href: "/lookbook" },
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
