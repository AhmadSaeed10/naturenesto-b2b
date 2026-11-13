import { type PhotoKey, photoUrl } from "./photos";
import type { Category, ImageAsset } from "./types";

// Stand-in photography (src/content/photos.ts). The tile label names the link, so the image
// is decorative (empty alt). Replace with the studio's own photography before launch.
const TILE_PHOTOS: Record<string, PhotoKey> = {
  "indoor-plants": "pothos-shelf",
  "outdoor-plants": "bougain-a",
  "pet-friendly": "spider-a",
  "easy-care": "snake-a",
  orchids: "phal-white",
  "large-plants": "fiddle-a",
  "low-light": "zz-a",
  "plant-care": "potting",
};

const tileImage = (slug: string): ImageAsset => ({
  src: photoUrl(TILE_PHOTOS[slug] ?? "monstera-pot", 900),
  alt: "",
  flag: "Stand-in photograph. Replace with the studio's own.",
});

export const categoriesTitle = "Plants For Everyone";

export const categories: Category[] = [
  {
    slug: "indoor-plants",
    title: "Indoor Plants",
    href: "/indoor-plants",
    image: tileImage("indoor-plants"),
  },
  {
    slug: "outdoor-plants",
    title: "Outdoor Plants",
    href: "/outdoor-plants",
    image: tileImage("outdoor-plants"),
  },
  {
    slug: "pet-friendly",
    title: "Pet Friendly Plants",
    href: "/plants/pet-friendly",
    image: tileImage("pet-friendly"),
  },
  {
    slug: "easy-care",
    title: "Easy Care Plants",
    href: "/plants/easy-care",
    image: tileImage("easy-care"),
  },
  { slug: "orchids", title: "Orchids", href: "/plants/orchids", image: tileImage("orchids") },
  {
    slug: "large-plants",
    title: "Large Plants",
    href: "/plants/large-plants",
    image: tileImage("large-plants"),
  },
  {
    slug: "low-light",
    title: "Low Light Tolerate Plants",
    href: "/plants/low-light",
    image: tileImage("low-light"),
  },
  {
    slug: "plant-care",
    title: "Plants Care",
    href: "/plants/plant-care",
    image: tileImage("plant-care"),
  },
];
