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
} as const;

export const NAV = [
  { label: "Collections", href: "/collections" },
  { label: "Lookbook", href: "/lookbook" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;
