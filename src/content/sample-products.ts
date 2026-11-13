import { catalogue } from "./catalogue";
import { photoUrl } from "./photos";
import { sampleCare } from "./sample-care";
import type { Product } from "./types";

// The shop catalogue as cards, built from src/content/catalogue.ts. It is shown when no live
// product source is configured, or when it returns nothing for a category, and it is what
// `npm run seed:generate` writes to the database. Prices and sizes are drafts.
// flag: confirm prices and stock with the client before launch.

function careFacts(id: string): Product["care"] {
  const facts = sampleCare[id];
  if (!facts) return undefined;
  return {
    light: facts.light || undefined,
    pet: facts.pet || undefined,
    level: facts.level || undefined,
  };
}

const CARD_WIDTH = 800;

export const sampleProducts: Product[] = catalogue.map((entry) => {
  const hover = entry.gallery?.[0];
  return {
    id: entry.handle,
    name: entry.name,
    price: entry.price,
    compareAtPrice: entry.compareAtPrice,
    categories: entry.categories,
    size: entry.size,
    badges: entry.badges,
    inStock: entry.inStock ?? true,
    // Every product has a page, so the shop never leads nowhere.
    href: `/products/${entry.handle}`,
    care: careFacts(entry.handle),
    // Decorative: the product name is printed right under the image.
    image: { src: photoUrl(entry.photo, CARD_WIDTH), alt: "", flag: "Stand-in photograph." },
    hoverImage: hover ? { src: photoUrl(hover, CARD_WIDTH), alt: "" } : undefined,
  };
});
