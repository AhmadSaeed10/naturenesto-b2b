import "server-only";
import { cacheLife } from "next/cache";
import { z } from "zod";
import { catalogCategories } from "@/content/catalog";
import { needHelp } from "@/content/home";
import { footerColumns, footerVisit, headerCta, headerNav, shopMenu } from "@/content/nav";
import { seo } from "@/content/seo";
import { site } from "@/content/site";
import type { Cta, FooterColumn, NavLink, SocialLink, SocialPlatform } from "@/content/types";
import type { DeliveryRates } from "@/lib/order";
import { reader } from "./reader";
import {
  HOME_SECTION_ORDER,
  type HomeSections,
  href,
  parseSection,
  sectionFallbacks,
} from "./sections";

// Storefront reads from the Keystatic files in content/. Every field is validated and
// falls back to src/content, so a bad edit degrades one value, never the page. Content
// only changes on a commit, which triggers a redeploy, so reads are cached for good.

export interface SiteChrome {
  announcement: { message: string; enabled: boolean };
  socials: SocialLink[];
  email: string;
  address: string;
  legal: string;
  whatsappHref: string;
  shopMenu: { label: string; links: NavLink[] };
  headerNav: NavLink[];
  headerCta: Cta;
  footerColumns: FooterColumn[];
  footerVisitHeading: string;
}

const PLATFORMS: readonly SocialPlatform[] = ["facebook", "instagram", "linkedin", "twitter"];

const FALLBACK_WHATSAPP =
  needHelp.channels.find((channel) => channel.kind === "whatsapp")?.href ?? `mailto:${site.email}`;

const nonEmpty = (value: string | null | undefined, fallback: string): string =>
  value && value.trim() ? value : fallback;

const linkSchema = z.object({ label: z.string().trim().min(1).max(80), href });
const linksSchema = z.array(linkSchema).min(1);

const validLinks = (value: unknown, fallback: NavLink[]): NavLink[] => {
  const parsed = linksSchema.safeParse(value);
  return parsed.success ? parsed.data : fallback;
};

const readSettings = () => reader.singletons.settings.read().catch(() => null);

export async function getSiteChrome(): Promise<SiteChrome> {
  "use cache";
  cacheLife("max");

  const [settings, navigation] = await Promise.all([
    readSettings(),
    reader.singletons.navigation.read().catch(() => null),
  ]);

  const whatsapp = settings?.whatsapp ?? "";
  const columns = (navigation?.footer ?? []).flatMap((column) => {
    const links = linksSchema.safeParse(column.links);
    return column.heading.trim() && links.success
      ? [{ heading: column.heading, links: links.data }]
      : [];
  });
  const cta = linkSchema.safeParse(navigation?.headerCta);

  return {
    announcement: settings
      ? {
          message: nonEmpty(settings.announcement.message, site.announcement),
          enabled: settings.announcement.enabled,
        }
      : { message: site.announcement, enabled: true },
    socials: PLATFORMS.map((platform) => {
      const saved = settings?.socials.find((social) => social.platform === platform);
      const original = site.socials.find((social) => social.platform === platform);
      return {
        platform,
        label: nonEmpty(saved?.label, original?.label ?? platform),
        href: nonEmpty(saved?.href, original?.href ?? "#"),
      };
    }),
    email: nonEmpty(settings?.email, site.email),
    address: nonEmpty(settings?.address, site.address),
    legal: nonEmpty(settings?.legal, site.legal),
    whatsappHref: /^\+\d{7,15}$/.test(whatsapp)
      ? `https://wa.me/${whatsapp.slice(1)}`
      : FALLBACK_WHATSAPP,
    // Built from the catalogue, so every category is always reachable from the header.
    shopMenu: {
      label: shopMenu.label,
      links: catalogCategories.map(({ title, href: link }) => ({ label: title, href: link })),
    },
    headerNav: validLinks(navigation?.header, headerNav),
    headerCta: cta.success ? cta.data : headerCta,
    footerColumns: columns.length ? columns : footerColumns,
    footerVisitHeading: footerVisit.heading,
  };
}

export interface HomeSeo {
  title: string;
  description: string;
}

export async function getHomeSeo(): Promise<HomeSeo> {
  "use cache";
  cacheLife("max");
  const settings = await readSettings();
  return {
    title: nonEmpty(settings?.seo.title, seo.home.title),
    description: nonEmpty(settings?.seo.description, seo.home.description),
  };
}

const allFallback = (): HomeSections => ({ ...sectionFallbacks });

/**
 * Builds the homepage from the Keystatic singleton. An invalid section falls back alone;
 * a section with "Show on the homepage" off stays null and is not rendered.
 */
export function buildHomeSections(home: Record<string, unknown> | null): HomeSections {
  if (!home) return allFallback();
  const result: Record<string, unknown> = {};
  for (const type of HOME_SECTION_ORDER) {
    const value = home[type];
    if (!value || typeof value !== "object") {
      result[type] = sectionFallbacks[type];
      continue;
    }
    const { show = true, ...data } = value as { show?: boolean } & Record<string, unknown>;
    result[type] = show ? (parseSection(type, data) ?? sectionFallbacks[type]) : null;
  }
  return result as HomeSections;
}

export async function getHomeSections(): Promise<HomeSections> {
  "use cache";
  cacheLife("max");
  const home = await reader.singletons.home.read().catch((error: unknown) => {
    console.warn("[cms] homepage fell back to src/content", error);
    return null;
  });
  return buildHomeSections(home);
}

// The Phase 9 placeholders, used until the settings file says otherwise.
const DELIVERY_FALLBACK: DeliveryRates = {
  lahore: 250,
  punjab: 400,
  pakistan: 600,
  freeOver: 15000,
};

export async function getDeliveryRates(): Promise<DeliveryRates> {
  "use cache";
  cacheLife("max");
  const delivery = (await readSettings())?.delivery;
  if (!delivery) return DELIVERY_FALLBACK;
  return {
    lahore: delivery.lahore ?? DELIVERY_FALLBACK.lahore,
    punjab: delivery.punjab ?? DELIVERY_FALLBACK.punjab,
    pakistan: delivery.pakistan ?? DELIVERY_FALLBACK.pakistan,
    freeOver: delivery.freeOver,
  };
}
