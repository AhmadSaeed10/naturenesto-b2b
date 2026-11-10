import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { CatalogSlug, Product } from "@/content/types";
import { getCatalog } from "@/lib/catalog";

const LIMIT = 4;
// Pots and care items pair with plants; plants pair with plants and pots.
const PAIRS: Partial<Record<CatalogSlug, CatalogSlug[]>> = {
  "indoor-plants": ["pots-and-planters"],
  "large-plants": ["pots-and-planters"],
  orchids: ["pots-and-planters"],
  "outdoor-plants": ["pots-and-planters"],
};

/** Up to four products from the same categories (then a paired category), never the product itself. */
export async function getRelatedProducts(
  handle: string,
  categories: CatalogSlug[],
): Promise<Product[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("products");
  const slugs = [...new Set([...categories, ...categories.flatMap((slug) => PAIRS[slug] ?? [])])];
  const seen = new Set<string>([handle]);
  const related: Product[] = [];
  for (const slug of slugs) {
    const { products } = await getCatalog(slug);
    for (const product of products) {
      if (seen.has(product.id) || !product.href) continue;
      seen.add(product.id);
      related.push(product);
      if (related.length === LIMIT) return related;
    }
  }
  return related;
}
