/**
 * Site-wide constants. Edit here, not in components.
 */
export const SITE = {
  name: "Midnight Chhaya",
  tagline: "Adornments forged in shadow.",
  description:
    "Handcrafted gothic jewelry — rings, pendants, earrings, and chokers, born in shadow and finished by hand.",
  url: "https://midnightchhaya.com",
  instagram: "https://www.instagram.com/midnight_chhaya/",
  instagramHandle: "@midnight_chhaya",
  email: "hello@midnightchhaya.com",
  currency: { code: "INR", symbol: "₹" },
  /** Logo file. The shipped JPG has a solid black background; consuming
   * components use `mix-blend-mode: screen` to drop the black and render
   * only the metallic wordmark over the dark scene. */
  logoPath: "/brand/logo.jpg",
  /** Intrinsic logo aspect (width / height). Used to size next/image. */
  logoAspect: 1600 / 663,
} as const;

export const NAV = [
  { label: "Collections", href: "/collections" },
  { label: "Lookbook", href: "/lookbook" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

/** Format an INR price. Returns "Inquire" when price is null. */
export function formatPrice(price: number | null): string {
  if (price == null) return "Inquire";
  return `${SITE.currency.symbol}${price.toLocaleString("en-IN")}`;
}
