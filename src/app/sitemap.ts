import type { MetadataRoute } from "next";
import { projects } from "@/content/projects";
import { solutions } from "@/content/solutions";
import { spaces } from "@/content/spaces";
import { stubPages } from "@/content/pages";
import { listProductHandles } from "@/lib/commerce/products";
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
    ...[
      "/marketplace",
      "/solutions",
      "/projects",
      ...solutions.map((item) => `/solutions/${item.slug}`),
      ...spaces.map((item) => `/spaces/${item.slug}`),
      ...projects.map((item) => `/projects/${item.slug}`),
    ].map((path) => ({
      url: `${base}${path}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...products.map((handle) => ({
      url: `${base}/products/${handle}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
