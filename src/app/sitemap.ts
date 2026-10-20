import type { MetadataRoute } from "next";
import { stubPages } from "@/content/pages";
import { listProductHandles } from "@/lib/catalog";
import { siteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const products = await listProductHandles();
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    ...stubPages.map((page) => ({
      url: `${base}${page.path}`,
      changeFrequency: "monthly" as const,
      priority: page.path.startsWith("/services") ? 0.8 : 0.6,
    })),
    ...products.map((handle) => ({
      url: `${base}/products/${handle}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
