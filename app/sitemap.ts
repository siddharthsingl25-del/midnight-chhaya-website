import type { MetadataRoute } from "next";
import { PRODUCTS } from "@/data/products";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const base: MetadataRoute.Sitemap = [
    { url: `${SITE.url}/`,            lastModified: now, priority: 1.0,  changeFrequency: "monthly" },
    { url: `${SITE.url}/collections`, lastModified: now, priority: 0.9,  changeFrequency: "weekly" },
    { url: `${SITE.url}/lookbook`,    lastModified: now, priority: 0.8,  changeFrequency: "monthly" },
    { url: `${SITE.url}/about`,       lastModified: now, priority: 0.7,  changeFrequency: "yearly" },
    { url: `${SITE.url}/contact`,     lastModified: now, priority: 0.6,  changeFrequency: "yearly" },
  ];
  const products: MetadataRoute.Sitemap = PRODUCTS.map((p) => ({
    url: `${SITE.url}/collections/${p.slug}`,
    lastModified: now,
    priority: 0.7,
    changeFrequency: "monthly",
  }));
  return [...base, ...products];
}
