import "server-only";
import { cacheLife } from "next/cache";
import { catalogCategories } from "@/content/catalog";
import type { CatalogSlug, Product } from "@/content/types";
import { reader } from "@/lib/cms/reader";

// Products are Keystatic entries in content/products, one YAML file per product. The
// handle is the file name and the product page lives at /products/<handle>.

export interface StoreProduct extends Product {
  handle: string;
  href: string;
  images: { src: string; alt: string }[];
  description: string;
  sample: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
}

export interface CatalogResult {
  products: StoreProduct[];
  /** True while any listed product is placeholder data. */
  hasSamples: boolean;
}

const SLUGS: readonly string[] = catalogCategories.map((category) => category.slug);
const isSlug = (value: string): value is CatalogSlug => SLUGS.includes(value);
const orNull = (value: string): string | null => (value.trim() ? value : null);

export async function listProducts(): Promise<StoreProduct[]> {
  "use cache";
  cacheLife("max");
  const entries = await reader.collections.products.all().catch((error: unknown) => {
    console.warn("[catalog] could not read content/products", error);
    return [];
  });
  return entries
    .flatMap(({ slug, entry }): StoreProduct[] => {
      const images = entry.images.flatMap((image) =>
        image.src ? [{ src: image.src, alt: image.alt }] : [],
      );
      const [first] = images;
      if (!first) return [];
      return [
        {
          id: slug,
          handle: slug,
          href: `/products/${slug}`,
          name: entry.title,
          price: entry.price,
          compareAtPrice:
            entry.compareAtPrice !== null && entry.compareAtPrice > entry.price
              ? entry.compareAtPrice
              : undefined,
          categories: entry.categories.filter(isSlug),
          image: first,
          images,
          size: orNull(entry.size) ?? undefined,
          badges: [...entry.badges],
          inStock: entry.inStock,
          sample: entry.sample,
          description: entry.description,
          seoTitle: orNull(entry.seoTitle),
          seoDescription: orNull(entry.seoDescription),
        },
      ];
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Products listed under one category. */
export async function getCatalog(slug: CatalogSlug): Promise<CatalogResult> {
  const products = (await listProducts()).filter((product) => product.categories.includes(slug));
  return { products, hasSamples: products.some((product) => product.sample) };
}

export async function getProduct(handle: string): Promise<StoreProduct | null> {
  return (await listProducts()).find((product) => product.handle === handle) ?? null;
}

export async function listProductHandles(): Promise<string[]> {
  return (await listProducts()).map((product) => product.handle);
}

/** What the cart and checkout need to show and price a line, keyed by handle. */
export interface CartProduct {
  handle: string;
  name: string;
  price: number;
  size: string | null;
  image: string;
  inStock: boolean;
}

export async function getCartCatalog(): Promise<Record<string, CartProduct>> {
  return Object.fromEntries(
    (await listProducts()).map((p) => [
      p.handle,
      {
        handle: p.handle,
        name: p.name,
        price: p.price,
        size: p.size ?? null,
        image: p.image.src,
        inStock: p.inStock,
      },
    ]),
  );
}
