import type { Metadata, Viewport } from "next";
import { Cinzel, Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

import SmoothScroll from "@/components/animations/SmoothScroll";
import Header from "@/components/ui/Header";
import FilmGrain from "@/components/ui/FilmGrain";
import PromoBanner from "@/components/ui/PromoBanner";
import PreOrderBanner from "@/components/ui/PreOrderBanner";
import { CartProvider } from "@/lib/cart";
import { CatalogProvider } from "@/lib/catalog-context";
import { StockProvider } from "@/lib/stock";
import { getAllProducts, getAllChains } from "@/lib/catalog";
import { syncSeedProducts } from "@/lib/seed-runner";
import { SITE } from "@/lib/site";

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
  applicationName: SITE.name,
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Chhaya Admin",
  },
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
  icons: {
    icon: SITE.logoPath,
    apple: SITE.logoPath,
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Sync any chat-added product seeds before fetching the catalog so the
  // first paint already includes them. Idempotent — runs once per cold
  // start, skips silently if Supabase env vars aren't set.
  await syncSeedProducts();

  // Pre-fetch the catalog on the server so the first paint already has
  // products + chains. The CatalogProvider keeps it fresh client-side.
  const [products, chains] = await Promise.all([
    getAllProducts(),
    getAllChains(),
  ]);

  return (
    <html
      lang="en"
      className={`${cinzel.variable} ${cormorant.variable} ${inter.variable}`}
    >
      <body className="bg-ink text-bone min-h-screen overflow-x-hidden">
        <CatalogProvider initialProducts={products} initialChains={chains}>
          <StockProvider>
            <CartProvider>
              <SmoothScroll>
                <PreOrderBanner />
                <PromoBanner />
                <Header />
                <main>{children}</main>
              </SmoothScroll>
              <FilmGrain />
            </CartProvider>
          </StockProvider>
        </CatalogProvider>
      </body>
    </html>
  );
}
