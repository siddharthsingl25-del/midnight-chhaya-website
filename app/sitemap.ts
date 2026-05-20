import type { MetadataRoute } from "next";
import { getAllProducts } from "@/lib/catalog";
import { SITE } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const base: MetadataRoute.Sitemap = [
    { url: `${SITE.url}/`,            lastModified: now, priority: 1.0,  changeFrequency: "monthly" },
    { url: `${SITE.url}/collections`, lastModified: now, priority: 0.9,  changeFrequency: "weekly" },
    { url: `${SITE.url}/exclusives`,  lastModified: now, priority: 0.85, changeFrequency: "weekly" },
    { url: `${SITE.url}/lookbook`,    lastModified: now, priority: 0.8,  changeFrequency: "monthly" },
    { url: `${SITE.url}/about`,       lastModified: now, priority: 0.7,  changeFrequency: "yearly" },
    { url: `${SITE.url}/contact`,     lastModified: now, priority: 0.6,  changeFrequency: "yearly" },
    { url: `${SITE.url}/checkout`,    lastModified: now, priority: 0.5,  changeFrequency: "yearly" },
    { url: `${SITE.url}/privacy`,     lastModified: now, priority: 0.4,  changeFrequency: "yearly" },
    { url: `${SITE.url}/shipping`,    lastModified: now, priority: 0.4,  changeFrequency: "yearly" },
    { url: `${SITE.url}/returns`,     lastModified: now, priority: 0.4,  changeFrequency: "yearly" },
  ];
  const products = await getAllProducts();
  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${SITE.url}/collections/${p.slug}`,
    lastModified: now,
    priority: 0.7,
    changeFrequency: "monthly",
  }));
  return [...base, ...productEntries];
}
