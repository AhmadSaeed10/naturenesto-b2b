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

export interface PairingPot {
  variantId: string;
  name: string;
  /** Rupees, like the catalogue cards. */
  price: number;
  image: string;
  size: string | null;
}

/**
 * Up to four in stock, single variant pots to offer beside a plant. Pots themselves get none,
 * and samples never do (they cannot be bought).
 */
export async function getPairingPots(categories: CatalogSlug[]): Promise<PairingPot[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("products");
  if (categories.includes("pots-and-planters")) return [];
  const { products, source } = await getCatalog("pots-and-planters");
  if (source !== "database") return [];
  return products
    .flatMap((product) =>
      product.quickAddVariantId
        ? [
            {
              variantId: product.quickAddVariantId,
              name: product.name,
              price: product.price,
              image: product.image.src,
              size: product.size ?? null,
            },
          ]
        : [],
    )
    .slice(0, 4);
}
