/**
 * Shared content types. Any field named `flag` marks an open item that needs client
 * confirmation before launch. List them with: grep -rn "flag:" src/content
 */

export interface NavLink {
  label: string;
  href: string;
  flag?: string;
}

export type SocialPlatform = "facebook" | "instagram" | "linkedin" | "twitter";

export interface SocialLink extends NavLink {
  platform: SocialPlatform;
}

export type Cta = NavLink;

export interface FooterColumn {
  heading: string;
  links: NavLink[];
}

export interface Service {
  slug: string;
  title: string;
  href: string;
  /** Path on the current live site, kept for 308 redirects. */
  legacyPath: string;
  icon: IconName;
  /** Styling only: receives the section's one botanical frame. */
  featured?: boolean;
}

export interface ImageAsset {
  src: string;
  /** Empty when the image is decorative (for example, a linked tile already named by its label). */
  alt: string;
  flag?: string;
}

export interface Category {
  slug: string;
  title: string;
  href: string;
  image: ImageAsset;
}

export interface Step {
  number: string;
  title: string;
  body: string;
  flag?: string;
}

export type IconName =
  | "plant"
  | "vase"
  | "table"
  | "guidance"
  | "community"
  | "support"
  | "floorplan"
  | "leaf"
  | "poster"
  | "gift"
  | "pot"
  | "building";

export interface IconItem {
  text: string;
  icon: IconName;
}

export interface ValueProp {
  title: string;
  body: string;
  icon: IconName;
}

export type ContactKind = "whatsapp" | "call" | "email";

export interface ContactChannel {
  kind: ContactKind;
  label: string;
  prompt: string;
  display: string;
  href: string;
  flag?: string;
}

export interface Redirect {
  source: string;
  destination: string;
  permanent: true;
}

export interface StubPageContent {
  path: string;
  title: string;
  todo: string;
}

/** Every category a product can be listed under: the shop pages plus the plant collections. */
export type CatalogSlug =
  | "pots-and-planters"
  | "indoor-plants"
  | "outdoor-plants"
  | "pet-friendly"
  | "easy-care"
  | "orchids"
  | "large-plants"
  | "low-light"
  | "plant-care";

export type ProductBadge = "new" | "pet-safe" | "low-light" | "easy-care" | "bestseller";

export interface Product {
  id: string;
  name: string;
  /** Price in Pakistani rupees, whole numbers. */
  price: number;
  compareAtPrice?: number;
  categories: CatalogSlug[];
  image: ImageAsset;
  size?: string;
  badges?: ProductBadge[];
  inStock: boolean;
  /** Product page. Sample products have one too, with enquiry instead of the cart. */
  href?: string;
  /** Second image, shown on hover where the card supports it. */
  hoverImage?: ImageAsset;
  /** Live products can be added to the cart straight from the card when they have one variant. */
  quickAddVariantId?: string;
}
