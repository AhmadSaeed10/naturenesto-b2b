import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { mediaUrl } from "@/lib/media";
import { and, asc, eq, sql } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/lib/db";
import type { Json } from "@/lib/db/enums";
import { blogPosts, faqItems, mediaAssets, pages, redirects, workshops } from "@/lib/db/schema";
import { publishedNow } from "@/lib/db/visibility";
import { richTextSource } from "./rich-text";
import { CMS_TAGS } from "./tags";

// Published CMS content for the storefront. Every query filters to published rows, so drafts
// never leak; results are cached per tag and revalidated by admin saves.

export interface CmsPage {
  handle: string;
  title: string;
  body: string;
  seoTitle: string | null;
  seoDescription: string | null;
}

export async function getPublishedPage(handle: string): Promise<CmsPage | null> {
  "use cache";
  cacheLife("days");
  cacheTag(CMS_TAGS.pages, `${CMS_TAGS.pages}:${handle}`);
  if (!isDatabaseConfigured() || handle === "home") return null;
  const [data] = await db()
    .select()
    .from(pages)
    .where(and(eq(pages.handle, handle), publishedNow(pages.status, pages.publishedAt)))
    .limit(1);
  return data
    ? {
        handle: data.handle,
        title: data.title,
        body: richTextSource(data.body as Json),
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
      }
    : null;
}

export interface PostSummary {
  handle: string;
  title: string;
  excerpt: string | null;
  cover: { src: string; alt: string } | null;
  publishedAt: string | null;
  tags: string[];
}

export interface Post extends PostSummary {
  body: string;
  seoTitle: string | null;
  seoDescription: string | null;
}

type CoverRow = {
  externalUrl: string | null;
  storagePath: string | null;
  alt: string;
  decorative: boolean;
} | null;
/** Cover columns joined from media_assets; the whole object is null when there is no cover. */
const coverColumns = {
  externalUrl: mediaAssets.externalUrl,
  storagePath: mediaAssets.storagePath,
  alt: mediaAssets.alt,
  decorative: mediaAssets.decorative,
};
const cover = (media: CoverRow) =>
  media ? { src: mediaUrl(media), alt: media.decorative ? "" : media.alt } : null;

export async function listPosts(): Promise<PostSummary[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CMS_TAGS.posts);
  if (!isDatabaseConfigured()) return [];
  const rows = await db()
    .select({
      handle: blogPosts.handle,
      title: blogPosts.title,
      excerpt: blogPosts.excerpt,
      tags: blogPosts.tags,
      publishedAt: blogPosts.publishedAt,
      media: coverColumns,
    })
    .from(blogPosts)
    .leftJoin(mediaAssets, eq(mediaAssets.id, blogPosts.coverMediaId))
    .where(publishedNow(blogPosts.status, blogPosts.publishedAt))
    .orderBy(sql`${blogPosts.publishedAt} desc nulls last`)
    .limit(100);
  return rows.map((row) => ({
    handle: row.handle,
    title: row.title,
    excerpt: row.excerpt,
    cover: cover(row.media),
    publishedAt: row.publishedAt?.toISOString() ?? null,
    tags: row.tags,
  }));
}

export async function getPost(handle: string): Promise<Post | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(CMS_TAGS.posts, `${CMS_TAGS.posts}:${handle}`);
  if (!isDatabaseConfigured()) return null;
  const [data] = await db()
    .select({
      handle: blogPosts.handle,
      title: blogPosts.title,
      excerpt: blogPosts.excerpt,
      body: blogPosts.body,
      tags: blogPosts.tags,
      publishedAt: blogPosts.publishedAt,
      seoTitle: blogPosts.seoTitle,
      seoDescription: blogPosts.seoDescription,
      media: coverColumns,
    })
    .from(blogPosts)
    .leftJoin(mediaAssets, eq(mediaAssets.id, blogPosts.coverMediaId))
    .where(and(eq(blogPosts.handle, handle), publishedNow(blogPosts.status, blogPosts.publishedAt)))
    .limit(1);
  return data
    ? {
        handle: data.handle,
        title: data.title,
        excerpt: data.excerpt,
        body: richTextSource(data.body as Json),
        cover: cover(data.media),
        publishedAt: data.publishedAt?.toISOString() ?? null,
        tags: data.tags,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
      }
    : null;
}

export interface Workshop {
  handle: string;
  title: string;
  summary: string | null;
  body: string;
  cover: { src: string; alt: string } | null;
  startsAt: string | null;
  endsAt: string | null;
  location: string | null;
  capacity: number | null;
  price: number | null;
}

export async function listWorkshops(): Promise<Workshop[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CMS_TAGS.workshops);
  if (!isDatabaseConfigured()) return [];
  const rows = await db()
    .select({
      handle: workshops.handle,
      title: workshops.title,
      summary: workshops.summary,
      body: workshops.body,
      startsAt: workshops.startsAt,
      endsAt: workshops.endsAt,
      location: workshops.location,
      capacity: workshops.capacity,
      price: workshops.price,
      media: coverColumns,
    })
    .from(workshops)
    .leftJoin(mediaAssets, eq(mediaAssets.id, workshops.coverMediaId))
    .where(publishedNow(workshops.status, workshops.publishedAt))
    .orderBy(sql`${workshops.startsAt} asc nulls last`)
    .limit(100);
  return rows.map((row) => ({
    handle: row.handle,
    title: row.title,
    summary: row.summary,
    body: richTextSource(row.body as Json),
    cover: cover(row.media),
    startsAt: row.startsAt?.toISOString() ?? null,
    endsAt: row.endsAt?.toISOString() ?? null,
    location: row.location,
    capacity: row.capacity,
    price: row.price,
  }));
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string | null;
}

export async function listFaq(): Promise<FaqItem[]> {
  "use cache";
  cacheLife("days");
  cacheTag(CMS_TAGS.faq);
  if (!isDatabaseConfigured()) return [];
  const rows = await db()
    .select()
    .from(faqItems)
    .where(eq(faqItems.status, "published"))
    .orderBy(asc(faqItems.position))
    .limit(200);
  return rows.map((row) => ({
    id: row.id,
    question: row.question,
    answer: richTextSource(row.answer as Json),
    category: row.category,
  }));
}

export interface StoredRedirect {
  destination: string;
  permanent: boolean;
}

/** Redirects added in the admin. Build time ones from src/content still run first. */
export async function getRedirect(path: string): Promise<StoredRedirect | null> {
  "use cache";
  cacheLife("days");
  cacheTag(CMS_TAGS.redirects);
  if (!isDatabaseConfigured()) return null;
  const [row] = await db()
    .select({ destination: redirects.destination, permanent: redirects.permanent })
    .from(redirects)
    .where(eq(redirects.source, path))
    .limit(1);
  return row ?? null;
}

/** Upcoming and past workshops, split when the cache fills (hourly and on every save). */
export async function getWorkshopGroups(): Promise<{ upcoming: Workshop[]; past: Workshop[] }> {
  "use cache";
  cacheLife("hours");
  cacheTag(CMS_TAGS.workshops);
  const workshops = await listWorkshops();
  const now = Date.now();
  const isUpcoming = (w: Workshop) =>
    !w.startsAt || new Date(w.endsAt ?? w.startsAt).getTime() >= now;
  return {
    upcoming: workshops.filter(isUpcoming),
    past: workshops.filter((w) => !isUpcoming(w)).reverse(),
  };
}
