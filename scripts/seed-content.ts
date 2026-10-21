// Generates db/seed.sql from the typed files in src/content, so the database starts
// with exactly the copy the storefront renders today. Run: npm run seed:generate
//
// The output is idempotent (fixed ids derived from stable keys, "on conflict do nothing"),
// so it can be applied to a fresh local database or re-applied to Neon safely (npm run db:seed).
// Staff invites are deliberately not part of the seed: emails are added out of band.
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { catalogCategories } from "../src/content/catalog.ts";
import { categories, categoriesTitle } from "../src/content/categories.ts";
import { banner, hero, needHelp, taglineStrip, valueProps } from "../src/content/home.ts";
import { footerColumns, headerCta, headerNav } from "../src/content/nav.ts";
import { redirects } from "../src/content/redirects.ts";
import { sampleProducts } from "../src/content/sample-products.ts";
import { seo } from "../src/content/seo.ts";
import { services, servicesEyebrow } from "../src/content/services.ts";
import { site } from "../src/content/site.ts";
import { howItWorks, steps } from "../src/content/steps.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outFile = resolve(root, "db/seed.sql");

/** Deterministic uuid from a stable key, so re-running the seed never duplicates rows. */
const id = (key: string): string => {
  const hex = createHash("sha256").update(`naturenesto:${key}`).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
};

type SqlValue = string | number | boolean | null | undefined | readonly string[] | object;

const literal = (value: SqlValue): string => {
  if (value === null || value === undefined) return "null";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string") return `'${value.replaceAll("'", "''")}'`;
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
    return value.length === 0 ? "'{}'::text[]" : `array[${value.map(literal).join(", ")}]::text[]`;
  }
  return `${literal(JSON.stringify(value))}::jsonb`;
};

const insert = (table: string, rows: Record<string, SqlValue>[], conflict = "id"): string => {
  const first = rows[0];
  if (!first) return "";
  const columns = Object.keys(first);
  const values = rows
    .map((row) => `  (${columns.map((column) => literal(row[column])).join(", ")})`)
    .join(",\n");
  return `insert into public.${table} (${columns.join(", ")}) values\n${values}\non conflict (${conflict}) do nothing;\n`;
};

const toPaisa = (rupees: number): number => Math.round(rupees * 100);

// Site settings --------------------------------------------------------------------------
const settings = insert(
  "site_settings",
  [
    {
      id: id("site_settings"),
      store_name: site.name,
      email: site.email,
      address: site.address,
      phones: site.phones,
      announcement: { message: site.announcement, enabled: true },
      socials: site.socials,
      seo: { home: seo.home, ogImage: seo.ogImage, flag: seo.flag },
      taglines: site.tagline,
      legal: site.legal,
    },
  ],
  "singleton",
);

// Navigation -----------------------------------------------------------------------------
const menus = [
  { handle: "header", title: "Header", links: headerNav },
  { handle: "header-cta", title: "Header call to action", links: [headerCta] },
  ...footerColumns.map((column) => ({
    handle: `footer-${column.heading.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}`,
    title: column.heading,
    links: column.links,
  })),
];
const navigationMenus = insert(
  "navigation_menus",
  menus.map(({ handle, title }) => ({ id: id(`menu:${handle}`), handle, title })),
);
const navigationItems = insert(
  "navigation_items",
  menus.flatMap(({ handle, links }) =>
    links.map((link, position) => ({
      id: id(`menu:${handle}:${link.href}:${position}`),
      menu_id: id(`menu:${handle}`),
      label: link.label,
      href: link.href,
      position,
    })),
  ),
);

// Homepage -------------------------------------------------------------------------------
const homeId = id("page:home");
const homePage = insert("pages", [
  {
    id: homeId,
    handle: "home",
    title: site.name,
    status: "published",
    seo_title: seo.home.title,
    seo_description: seo.home.description,
  },
]);
const sections: { type: string; data: object }[] = [
  { type: "hero", data: hero },
  { type: "tagline", data: { items: taglineStrip } },
  { type: "value_props", data: { items: valueProps } },
  { type: "how_it_works", data: { ...howItWorks, steps } },
  { type: "services", data: { eyebrow: servicesEyebrow, services } },
  { type: "banner", data: banner },
  { type: "plants", data: { title: categoriesTitle, categories } },
  { type: "need_help", data: needHelp },
];
const pageSections = insert(
  "page_sections",
  sections.map(({ type, data }, position) => ({
    id: id(`page:home:section:${type}`),
    page_id: homeId,
    type,
    position,
    data,
    status: "published",
  })),
);

// Services -------------------------------------------------------------------------------
const serviceRows = insert(
  "services",
  services.map((service, position) => ({
    id: id(`service:${service.slug}`),
    handle: service.slug,
    title: service.title,
    icon: service.icon,
    featured: service.featured ?? false,
    position,
    status: "published",
  })),
);

// Collections: the storefront's category pages, matched by product tag ---------------------
const collections = insert(
  "collections",
  catalogCategories.map((category, position) => ({
    id: id(`collection:${category.slug}`),
    handle: category.slug,
    title: category.title,
    kind: "automatic",
    rules: [{ field: "tag", op: "contains", value: category.slug }],
    sort_order: "title",
    status: "published",
    position,
  })),
);

// Redirects ------------------------------------------------------------------------------
const redirectRows = insert(
  "redirects",
  redirects.map((redirect) => ({
    id: id(`redirect:${redirect.source}`),
    source: redirect.source,
    destination: redirect.destination,
    permanent: redirect.permanent,
  })),
  "source",
);

// Sample catalogue: drafts, so the storefront keeps its sample fallback until real products
// are activated in Admin. Images are the placeholder files already served by the site.
const media = insert(
  "media_assets",
  [...new Set(sampleProducts.map((product) => product.image.src))].map((src) => ({
    id: id(`media:${src}`),
    external_url: src,
    mime_type: "image/webp",
    decorative: true,
    alt: "",
    title: "Placeholder product image",
  })),
);
const products = insert(
  "products",
  sampleProducts.map((product) => ({
    id: id(`product:${product.id}`),
    handle: product.id,
    title: product.name,
    status: "draft",
    vendor: site.name,
    tags: [...product.categories, ...(product.badges ?? []).map((badge) => `badge:${badge}`)],
  })),
);
const variants = insert(
  "product_variants",
  sampleProducts.map((product) => ({
    id: id(`variant:${product.id}`),
    product_id: id(`product:${product.id}`),
    title: product.size ?? "Default",
    sku: `SAMPLE-${product.id.toUpperCase()}`,
    price: toPaisa(product.price),
    compare_at_price: product.compareAtPrice ? toPaisa(product.compareAtPrice) : null,
    stock: product.inStock ? 10 : 0,
  })),
);
const images = insert(
  "product_images",
  sampleProducts.map((product) => ({
    id: id(`image:${product.id}`),
    product_id: id(`product:${product.id}`),
    media_id: id(`media:${product.image.src}`),
    position: 0,
  })),
);

const sql = [
  "-- Generated by scripts/seed-content.ts from src/content. Do not edit by hand.\n",
  settings,
  navigationMenus,
  navigationItems,
  homePage,
  pageSections,
  serviceRows,
  collections,
  redirectRows,
  media,
  products,
  variants,
  images,
].join("\n");

writeFileSync(outFile, sql);
console.log(`Wrote ${outFile}`);
