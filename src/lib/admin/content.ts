import "server-only";
import { richTextSource } from "@/lib/cms/rich-text";
import {
  HOME_SECTION_ORDER,
  type HomeSectionType,
  isHomeSectionType,
  parseSection,
  sectionFallbacks,
} from "@/lib/cms/sections";
import { asc, desc, eq, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import type { Enums, Json } from "@/lib/db/enums";
import {
  blogPosts,
  faqItems,
  navigationItems,
  navigationMenus,
  pageSectionDrafts,
  pageSections,
  pages,
  redirects,
  workshops,
} from "@/lib/db/schema";

type ContentStatus = Enums<"content_status">;

export interface SectionSummary {
  type: HomeSectionType;
  visible: boolean;
  hasDraft: boolean;
  exists: boolean;
}

async function homeRows() {
  const rows = await db()
    .select({
      type: pageSections.type,
      data: pageSections.data,
      status: pageSections.status,
      draft: pageSectionDrafts.data,
    })
    .from(pageSections)
    .innerJoin(pages, eq(pages.id, pageSections.pageId))
    .leftJoin(pageSectionDrafts, eq(pageSectionDrafts.sectionId, pageSections.id))
    .where(eq(pages.handle, "home"));
  return rows.map((row) => ({
    type: row.type as string,
    data: row.data as unknown,
    status: row.status,
    draft: (row.draft ?? null) as unknown,
  }));
}

export async function listHomeSections(): Promise<SectionSummary[]> {
  const rows = await homeRows();
  return HOME_SECTION_ORDER.map((type) => {
    const row = rows.find((r) => r.type === type);
    return {
      type,
      visible: row?.status === "published",
      hasDraft: Boolean(row?.draft),
      exists: Boolean(row),
    };
  });
}

export interface SectionForEditor {
  type: HomeSectionType;
  /** What the form starts from: the draft if there is one, else the live data. */
  value: unknown;
  hasDraft: boolean;
  visible: boolean;
}

export async function getSectionForEditor(type: string): Promise<SectionForEditor | null> {
  if (!isHomeSectionType(type)) return null;
  const row = (await homeRows()).find((r) => r.type === type);
  const start = row?.draft ?? row?.data;
  return {
    type,
    // Anything unreadable starts from the shipped copy rather than an empty form.
    value: parseSection(type, start) ?? sectionFallbacks[type],
    hasDraft: Boolean(row?.draft),
    visible: row?.status === "published",
  };
}

/** Sections with drafts applied, for the staff only preview. */
export async function previewHomeRows(): Promise<{ type: string; data: unknown }[]> {
  const rows = await homeRows();
  return rows
    .filter((row) => row.status === "published")
    .map((row) => ({ type: row.type, data: row.draft ?? row.data }));
}

export interface DocSummary {
  id: string;
  title: string;
  handle: string;
  status: ContentStatus;
  date: string | null;
}

export async function listDocs(kind: "pages" | "blog" | "workshops"): Promise<DocSummary[]> {
  if (kind === "pages") {
    const rows = await db()
      .select({
        id: pages.id,
        title: pages.title,
        handle: pages.handle,
        status: pages.status,
        updatedAt: pages.updatedAt,
      })
      .from(pages)
      .where(ne(pages.handle, "home"))
      .orderBy(asc(pages.title));
    return rows.map((row) => ({ ...row, date: row.updatedAt.toISOString() }));
  }
  if (kind === "blog") {
    const rows = await db()
      .select({
        id: blogPosts.id,
        title: blogPosts.title,
        handle: blogPosts.handle,
        status: blogPosts.status,
        publishedAt: blogPosts.publishedAt,
        updatedAt: blogPosts.updatedAt,
      })
      .from(blogPosts)
      .orderBy(desc(blogPosts.updatedAt));
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      handle: row.handle,
      status: row.status,
      date: (row.publishedAt ?? row.updatedAt).toISOString(),
    }));
  }
  const rows = await db()
    .select({
      id: workshops.id,
      title: workshops.title,
      handle: workshops.handle,
      status: workshops.status,
      startsAt: workshops.startsAt,
    })
    .from(workshops)
    .orderBy(sql`${workshops.startsAt} desc nulls first`);
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    handle: row.handle,
    status: row.status,
    date: row.startsAt?.toISOString() ?? null,
  }));
}

export interface PageForEditor {
  id: string;
  title: string;
  handle: string;
  body: string;
  published: boolean;
  seoTitle: string;
  seoDescription: string;
  version: string;
}

export async function getPageForEditor(id: string): Promise<PageForEditor | null> {
  const [data] = await db()
    .select()
    .from(pages)
    .where(sql`${pages.id} = ${id} and ${pages.handle} <> 'home'`)
    .limit(1);
  return data
    ? {
        id: data.id,
        title: data.title,
        handle: data.handle,
        body: richTextSource(data.body as Json),
        published: data.status === "published",
        seoTitle: data.seoTitle ?? "",
        seoDescription: data.seoDescription ?? "",
        version: data.updatedAt.toISOString(),
      }
    : null;
}

export interface PostForEditor {
  id: string;
  title: string;
  handle: string;
  excerpt: string;
  coverId: string;
  tags: string[];
  body: string;
  published: boolean;
  publishedAt: string;
  seoTitle: string;
  seoDescription: string;
  version: string;
}

export async function getPostForEditor(id: string): Promise<PostForEditor | null> {
  const [data] = await db().select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
  return data
    ? {
        id: data.id,
        title: data.title,
        handle: data.handle,
        excerpt: data.excerpt ?? "",
        coverId: data.coverMediaId ?? "",
        tags: data.tags,
        body: richTextSource(data.body as Json),
        published: data.status === "published",
        publishedAt: data.publishedAt?.toISOString() ?? "",
        seoTitle: data.seoTitle ?? "",
        seoDescription: data.seoDescription ?? "",
        version: data.updatedAt.toISOString(),
      }
    : null;
}

export interface WorkshopForEditor {
  id: string;
  title: string;
  handle: string;
  summary: string;
  coverId: string;
  body: string;
  startsAt: string;
  endsAt: string;
  location: string;
  capacity: string;
  price: number | null;
  published: boolean;
  version: string;
}

export async function getWorkshopForEditor(id: string): Promise<WorkshopForEditor | null> {
  const [data] = await db().select().from(workshops).where(eq(workshops.id, id)).limit(1);
  return data
    ? {
        id: data.id,
        title: data.title,
        handle: data.handle,
        summary: data.summary ?? "",
        coverId: data.coverMediaId ?? "",
        body: richTextSource(data.body as Json),
        startsAt: data.startsAt?.toISOString() ?? "",
        endsAt: data.endsAt?.toISOString() ?? "",
        location: data.location ?? "",
        capacity: data.capacity === null ? "" : String(data.capacity),
        price: data.price,
        published: data.status === "published",
        version: data.updatedAt.toISOString(),
      }
    : null;
}

export interface FaqForEditor {
  id: string;
  question: string;
  answer: string;
  category: string;
  position: number;
  published: boolean;
}

export async function listFaqForEditor(): Promise<FaqForEditor[]> {
  const rows = await db()
    .select()
    .from(faqItems)
    .orderBy(asc(faqItems.position), asc(faqItems.createdAt));
  return rows.map((row) => ({
    id: row.id,
    question: row.question,
    answer: richTextSource(row.answer as Json),
    category: row.category ?? "",
    position: row.position,
    published: row.status === "published",
  }));
}

export interface MenuForEditor {
  id: string;
  handle: string;
  title: string;
  items: { label: string; href: string }[];
}

export async function listMenus(): Promise<MenuForEditor[]> {
  const rows = await db()
    .select({
      id: navigationMenus.id,
      handle: navigationMenus.handle,
      title: navigationMenus.title,
      label: navigationItems.label,
      href: navigationItems.href,
    })
    .from(navigationMenus)
    .leftJoin(navigationItems, eq(navigationItems.menuId, navigationMenus.id))
    .orderBy(asc(navigationMenus.handle), asc(navigationItems.position));
  const menus = new Map<string, MenuForEditor>();
  for (const row of rows) {
    const menu = menus.get(row.id) ?? {
      id: row.id,
      handle: row.handle,
      title: row.title,
      items: [],
    };
    if (row.label !== null && row.href !== null)
      menu.items.push({ label: row.label, href: row.href });
    menus.set(row.id, menu);
  }
  // Header menus first, then the footer columns in their storefront order.
  const order = [
    "header",
    "header-cta",
    "footer-services",
    "footer-customer-services",
    "footer-explore",
  ];
  const rank = (handle: string) => (order.includes(handle) ? order.indexOf(handle) : order.length);
  return [...menus.values()].sort((a, b) => rank(a.handle) - rank(b.handle));
}

export interface RedirectRow {
  id: string;
  source: string;
  destination: string;
  permanent: boolean;
}

export async function listRedirects(): Promise<RedirectRow[]> {
  return db()
    .select({
      id: redirects.id,
      source: redirects.source,
      destination: redirects.destination,
      permanent: redirects.permanent,
    })
    .from(redirects)
    .orderBy(asc(redirects.source));
}
