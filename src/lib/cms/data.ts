import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";
import { needHelp } from "@/content/home";
import { footerColumns, footerVisit, headerCta, headerNav } from "@/content/nav";
import { seo } from "@/content/seo";
import { site } from "@/content/site";
import type { Cta, FooterColumn, NavLink, SocialLink } from "@/content/types";
import {
  announcementSchema,
  phonesSchema,
  seoSchema,
  socialsSchema,
} from "@/lib/admin/settings-schema";
import { and, asc, eq } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/lib/db";
import {
  navigationItems,
  navigationMenus,
  pageSections,
  pages,
  siteSettings,
} from "@/lib/db/schema";
import { publishedNow } from "@/lib/db/visibility";
import { CMS_TAGS } from "./tags";
import {
  HOME_SECTION_ORDER,
  type HomeSections,
  isHomeSectionType,
  parseSection,
  sectionFallbacks,
} from "./sections";

// Storefront reads. Everything is cached per tag and revalidated by admin saves, and every
// field falls back to src/content, so the site renders the same with or without Supabase.

export interface SiteChrome {
  announcement: { message: string; enabled: boolean };
  socials: SocialLink[];
  email: string;
  address: string;
  legal: string;
  whatsappHref: string;
  headerNav: NavLink[];
  headerCta: Cta;
  footerColumns: FooterColumn[];
  footerVisitHeading: string;
}

const PLATFORMS = ["facebook", "instagram", "linkedin", "twitter"] as const;

const FALLBACK_CHROME: SiteChrome = {
  announcement: { message: site.announcement, enabled: true },
  socials: [...site.socials],
  email: site.email,
  address: site.address,
  legal: site.legal,
  whatsappHref:
    needHelp.channels.find((channel) => channel.kind === "whatsapp")?.href ??
    `mailto:${site.email}`,
  headerNav,
  headerCta,
  footerColumns,
  footerVisitHeading: footerVisit.heading,
};

const nonEmpty = (value: string | null | undefined, fallback: string): string =>
  value && value.trim() ? value : fallback;

export async function getSiteChrome(): Promise<SiteChrome> {
  "use cache";
  cacheLife("days");
  cacheTag(CMS_TAGS.settings, CMS_TAGS.navigation);

  if (!isDatabaseConfigured()) return FALLBACK_CHROME;

  let row:
    | {
        email: string;
        address: string;
        legal: string | null;
        phones: unknown;
        announcement: unknown;
        socials: unknown;
      }
    | undefined;
  let menuRows: {
    handle: string;
    title: string;
    label: string | null;
    href: string | null;
    position: number | null;
  }[];
  try {
    [[row], menuRows] = await Promise.all([
      db()
        .select({
          email: siteSettings.email,
          address: siteSettings.address,
          legal: siteSettings.legal,
          phones: siteSettings.phones,
          announcement: siteSettings.announcement,
          socials: siteSettings.socials,
        })
        .from(siteSettings)
        .limit(1),
      db()
        .select({
          handle: navigationMenus.handle,
          title: navigationMenus.title,
          label: navigationItems.label,
          href: navigationItems.href,
          position: navigationItems.position,
        })
        .from(navigationMenus)
        .leftJoin(navigationItems, eq(navigationItems.menuId, navigationMenus.id))
        .orderBy(asc(navigationItems.position)),
    ]);
  } catch (error) {
    console.warn(
      "[cms] chrome fell back to src/content",
      error instanceof Error ? error.message : error,
    );
    return FALLBACK_CHROME;
  }

  const announcement = announcementSchema.safeParse(row?.announcement ?? {});
  const phones = phonesSchema.safeParse(row?.phones ?? {});
  const socials = socialsSchema.safeParse(row?.socials ?? []);
  const menus = new Map<string, { title: string; items: NavLink[] }>();
  for (const item of menuRows) {
    const menu = menus.get(item.handle) ?? { title: item.title, items: [] };
    // Rows arrive ordered by position; a menu with no items has one row with null fields.
    if (item.label !== null && item.href !== null) {
      menu.items.push({ label: item.label, href: item.href });
    }
    menus.set(item.handle, menu);
  }
  const menuLinks = (handle: string, fallback: NavLink[]): NavLink[] => {
    const items = menus.get(handle)?.items;
    return items && items.length ? items : fallback;
  };

  const whatsapp = phones.success ? phones.data.whatsapp.e164 : "";
  const columns = [...menus.entries()]
    .filter(([handle, menu]) => handle.startsWith("footer-") && menu.items.length > 0)
    .map(([, menu]) => ({ heading: menu.title, links: menu.items }));

  return {
    announcement: announcement.success
      ? {
          message: nonEmpty(announcement.data.message, site.announcement),
          enabled: announcement.data.enabled,
        }
      : FALLBACK_CHROME.announcement,
    socials: socials.success
      ? PLATFORMS.map((platform) => {
          const saved = socials.data.find((social) => social.platform === platform);
          const original = site.socials.find((social) => social.platform === platform);
          return {
            platform,
            label: saved?.label || original?.label || platform,
            href: nonEmpty(saved?.href, original?.href ?? "#"),
          };
        })
      : FALLBACK_CHROME.socials,
    email: nonEmpty(row?.email, site.email),
    address: nonEmpty(row?.address, site.address),
    legal: nonEmpty(row?.legal, site.legal),
    whatsappHref: /^\+\d{7,15}$/.test(whatsapp)
      ? `https://wa.me/${whatsapp.slice(1)}`
      : FALLBACK_CHROME.whatsappHref,
    headerNav: menuLinks("header", headerNav),
    headerCta: menuLinks("header-cta", [headerCta])[0] ?? headerCta,
    // Footer menus keep their seed order: services, customer services, explore.
    footerColumns: columns.length ? orderColumns(columns) : footerColumns,
    footerVisitHeading: footerVisit.heading,
  };
}

const FOOTER_ORDER = footerColumns.map((column) => column.heading);
function orderColumns(columns: FooterColumn[]): FooterColumn[] {
  const rank = (heading: string) => {
    const index = FOOTER_ORDER.indexOf(heading);
    return index === -1 ? FOOTER_ORDER.length : index;
  };
  return [...columns].sort((a, b) => rank(a.heading) - rank(b.heading));
}

export interface HomeSeo {
  title: string;
  description: string;
}

export async function getHomeSeo(): Promise<HomeSeo> {
  "use cache";
  cacheLife("days");
  cacheTag(CMS_TAGS.settings);
  if (!isDatabaseConfigured()) return seo.home;
  let stored: unknown;
  try {
    [{ seo: stored } = { seo: {} }] = await db()
      .select({ seo: siteSettings.seo })
      .from(siteSettings)
      .limit(1);
  } catch {
    return seo.home;
  }
  const parsed = seoSchema.safeParse(stored ?? {});
  return parsed.success
    ? {
        title: nonEmpty(parsed.data.home.title, seo.home.title),
        description: nonEmpty(parsed.data.home.description, seo.home.description),
      }
    : seo.home;
}

const allFallback = (): HomeSections => ({ ...sectionFallbacks });

const sectionRow = z.object({ type: z.string(), data: z.unknown() });

/** Builds the homepage from section rows; a missing or invalid section falls back alone. */
export function buildHomeSections(rows: { type: string; data: unknown }[]): HomeSections {
  // No rows at all means the database is empty or unreachable: show the shipped copy.
  if (rows.length === 0) return allFallback();
  const result = Object.fromEntries(HOME_SECTION_ORDER.map((type) => [type, null])) as HomeSections;
  for (const row of rows) {
    const parsed = sectionRow.safeParse(row);
    if (!parsed.success || !isHomeSectionType(parsed.data.type)) continue;
    const type = parsed.data.type;
    // An invalid block keeps the page whole by using the shipped copy for that section.
    (result as Record<string, unknown>)[type] =
      parseSection(type, parsed.data.data) ?? sectionFallbacks[type];
  }
  // Sections the public cannot see (hidden as drafts) stay null and are not rendered.
  return result;
}

export async function getHomeSections(): Promise<HomeSections> {
  "use cache";
  cacheLife("days");
  cacheTag(CMS_TAGS.home);

  if (!isDatabaseConfigured()) return allFallback();
  try {
    // Hidden sections and a hidden or scheduled page stay out of the public homepage.
    const rows = await db()
      .select({ type: pageSections.type, data: pageSections.data })
      .from(pageSections)
      .innerJoin(pages, eq(pages.id, pageSections.pageId))
      .where(
        and(
          eq(pages.handle, "home"),
          eq(pageSections.status, "published"),
          publishedNow(pages.status, pages.publishedAt),
        ),
      )
      .orderBy(asc(pageSections.position));
    return buildHomeSections(rows);
  } catch (error) {
    console.warn(
      "[cms] homepage fell back to src/content",
      error instanceof Error ? error.message : error,
    );
    return allFallback();
  }
}
