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
import { catalogue, defaultIncluded, specRows } from "../src/content/catalogue.ts";
import { photos, photoUrl } from "../src/content/photos.ts";
import { sampleCare } from "../src/content/sample-care.ts";
import { toRichText } from "../src/lib/cms/rich-text.ts";
import { categories, categoriesTitle } from "../src/content/categories.ts";
import { banner, hero, needHelp, taglineStrip, valueProps } from "../src/content/home.ts";
import { footerColumns, headerCta, headerNav } from "../src/content/nav.ts";
import { redirects } from "../src/content/redirects.ts";
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

const insert = (
  table: string,
  rows: Record<string, SqlValue>[],
  conflict = "id",
  /** Columns refreshed on re-seed; empty keeps existing rows untouched. */
  update: string[] = [],
): string => {
  const first = rows[0];
  if (!first) return "";
  const columns = Object.keys(first);
  const values = rows
    .map((row) => `  (${columns.map((column) => literal(row[column])).join(", ")})`)
    .join(",\n");
  return `insert into public.${table} (${columns.join(", ")}) values\n${values}\n${
    update.length > 0
      ? `on conflict (${conflict}) do update set ${update.map((c) => `${c} = excluded.${c}`).join(", ")};\n`
      : `on conflict (${conflict}) do nothing;\n`
  }`;
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

// Catalogue (src/content/catalogue.ts). New products start as drafts so nothing goes live by
// accident; products that already exist keep their status and stock but take the refreshed
// copy, price and photos, so re-running the seed updates the shop to this catalogue.
const photoKeys = [
  ...new Set(catalogue.flatMap((entry) => [entry.photo, ...(entry.gallery ?? [])])),
];
const media = insert(
  "media_assets",
  photoKeys.map((key) => ({
    id: id(`media:${photoUrl(key)}`),
    external_url: photoUrl(key),
    mime_type: "image/jpeg",
    decorative: false,
    alt: photos[key].alt,
    title: `${photos[key].alt} (photo by ${photos[key].credit}, Unsplash)`,
  })),
);
const products = insert(
  "products",
  catalogue.map((entry) => ({
    id: id(`product:${entry.handle}`),
    handle: entry.handle,
    title: entry.name,
    status: "draft",
    vendor: site.name,
    product_type: { plant: "Plant", pot: "Pot & planter", care: "Plant care" }[entry.kind],
    tags: [...entry.categories, ...(entry.badges ?? []).map((badge) => `badge:${badge}`)],
    description: toRichText(entry.description),
    short_description: entry.short,
    specs: specRows(entry),
    included: entry.included ?? defaultIncluded(entry.kind),
    care: { ...sampleCare[entry.handle], size: entry.size },
  })),
  "id",
  [
    "title",
    "vendor",
    "product_type",
    "tags",
    "description",
    "short_description",
    "specs",
    "included",
    "care",
  ],
);
const variants = insert(
  "product_variants",
  catalogue.map((entry) => ({
    id: id(`variant:${entry.handle}`),
    product_id: id(`product:${entry.handle}`),
    title: entry.size,
    sku: `NN-${entry.handle.toUpperCase()}`,
    price: toPaisa(entry.price),
    compare_at_price: entry.compareAtPrice ? toPaisa(entry.compareAtPrice) : null,
    stock: entry.inStock === false ? 0 : 10,
  })),
  "id",
  ["title", "sku", "price", "compare_at_price"],
);
const images = insert(
  "product_images",
  catalogue.flatMap((entry) =>
    [entry.photo, ...(entry.gallery ?? [])].map((key, index) => ({
      // Position 0 keeps the id it always had, so the first photo replaces the old placeholder.
      id: id(index === 0 ? `image:${entry.handle}` : `image:${entry.handle}:${index}`),
      product_id: id(`product:${entry.handle}`),
      media_id: id(`media:${photoUrl(key)}`),
      position: index,
    })),
  ),
  "id",
  ["media_id", "position"],
);

// The old placeholder artwork is dropped from products so it never shows beside the photos.
const dropPlaceholders = `delete from public.product_images pi using public.media_assets m
  where pi.media_id = m.id and m.external_url like '/images/products/%';\n`;

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
  dropPlaceholders,
  images,
].join("\n");

writeFileSync(outFile, sql);
console.log(`Wrote ${outFile}`);
