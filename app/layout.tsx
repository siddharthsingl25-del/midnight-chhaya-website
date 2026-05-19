import type { Metadata, Viewport } from "next";
import { Cinzel, Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

import SmoothScroll from "@/components/animations/SmoothScroll";
import Header from "@/components/ui/Header";
import FilmGrain from "@/components/ui/FilmGrain";
import { CartProvider } from "@/lib/cart";
import { StockProvider } from "@/lib/stock";
import { SITE } from "@/lib/site";

/* Cinzel — display headings (gothic serif).
 * Cormorant Garamond — body serif accents.
 * Inter — sans-serif body. All self-hosted via next/font (zero CLS). */
const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cinzel",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: `${SITE.name} — ${SITE.tagline}`, template: `%s · ${SITE.name}` },
  description: SITE.description,
  openGraph: {
    title: SITE.name,
    description: SITE.description,
    url: SITE.url,
    siteName: SITE.name,
    images: [{ url: SITE.logoPath, width: 512, height: 512, alt: SITE.name }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.name,
    description: SITE.description,
    images: [SITE.logoPath],
  },
  icons: { icon: SITE.logoPath },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${cinzel.variable} ${cormorant.variable} ${inter.variable}`}
    >
      <body className="bg-ink text-bone min-h-screen overflow-x-hidden">
        <StockProvider>
          <CartProvider>
            <SmoothScroll>
              <Header />
              <main>{children}</main>
            </SmoothScroll>
            <FilmGrain />
          </CartProvider>
        </StockProvider>
      </body>
    </html>
  );
}
