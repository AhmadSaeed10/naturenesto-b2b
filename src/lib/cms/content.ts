import "server-only";
import { cacheLife } from "next/cache";
import { reader } from "./reader";

// Pages, blog, workshops, FAQ and redirects from the Keystatic files in content/.

export interface CmsPage {
  handle: string;
  title: string;
  eyebrow: string | null;
  intro: string | null;
  image: { src: string; alt: string } | null;
  body: string;
  seoTitle: string | null;
  seoDescription: string | null;
}

type CoverFields = { src: string | null; alt: string };
const cover = ({ src, alt }: CoverFields) => (src ? { src, alt } : null);

const orNull = (value: string | null | undefined): string | null =>
  value && value.trim() ? value : null;

export async function getPublishedPage(handle: string): Promise<CmsPage | null> {
  "use cache";
  cacheLife("max");
  const page = await reader.collections.pages.read(handle).catch(() => null);
  return page
    ? {
        handle,
        title: page.title,
        eyebrow: orNull(page.eyebrow),
        intro: orNull(page.intro),
        image: cover(page.image),
        body: page.body,
        seoTitle: orNull(page.seoTitle),
        seoDescription: orNull(page.seoDescription),
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

// A post without a date is a draft; a future date stays hidden until it passes. The list
// is cached for an hour so scheduled posts appear without a redeploy.
const isLive = (date: string | null): date is string =>
  Boolean(date) && new Date(date ?? "").getTime() <= Date.now();

export async function listPosts(): Promise<PostSummary[]> {
  "use cache";
  cacheLife("hours");
  const entries = await reader.collections.posts.all().catch(() => []);
  return entries
    .filter(({ entry }) => isLive(entry.publishedAt))
    .map(({ slug, entry }) => ({
      handle: slug,
      title: entry.title,
      excerpt: orNull(entry.excerpt),
      cover: cover(entry.cover),
      publishedAt: entry.publishedAt,
      tags: [...entry.tags],
    }))
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
}

export async function getPost(handle: string): Promise<Post | null> {
  "use cache";
  cacheLife("hours");
  const entry = await reader.collections.posts.read(handle).catch(() => null);
  if (!entry || !isLive(entry.publishedAt)) return null;
  return {
    handle,
    title: entry.title,
    excerpt: orNull(entry.excerpt),
    body: entry.body,
    cover: cover(entry.cover),
    publishedAt: entry.publishedAt,
    tags: [...entry.tags],
    seoTitle: orNull(entry.seoTitle),
    seoDescription: orNull(entry.seoDescription),
  };
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
  /** Rupees; 0 is free. */
  price: number | null;
}

export async function listWorkshops(): Promise<Workshop[]> {
  "use cache";
  cacheLife("hours");
  const entries = await reader.collections.workshops.all().catch(() => []);
  return entries
    .filter(({ entry }) => entry.published)
    .map(({ slug, entry }) => ({
      handle: slug,
      title: entry.title,
      summary: orNull(entry.summary),
      body: entry.body,
      cover: cover(entry.cover),
      startsAt: entry.startsAt,
      endsAt: entry.endsAt,
      location: orNull(entry.location),
      capacity: entry.capacity,
      price: entry.price,
    }))
    .sort((a, b) => (a.startsAt ?? "￿").localeCompare(b.startsAt ?? "￿"));
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string | null;
}

export async function listFaq(): Promise<FaqItem[]> {
  "use cache";
  cacheLife("max");
  const faq = await reader.singletons.faq.read().catch(() => null);
  return (faq?.items ?? []).map((item, index) => ({
    id: String(index),
    question: item.question,
    answer: item.answer,
    category: orNull(item.category),
  }));
}

export interface StoredRedirect {
  destination: string;
  permanent: boolean;
}

/** Redirects edited in the CMS. Build time ones from src/content still run first. */
export async function getRedirect(path: string): Promise<StoredRedirect | null> {
  "use cache";
  cacheLife("max");
  const redirects = await reader.singletons.redirects.read().catch(() => null);
  const match = redirects?.items.find((item) => item.source === path);
  return match ? { destination: match.destination, permanent: match.permanent } : null;
}

/** Upcoming and past workshops, split when the cache fills (hourly). */
export async function getWorkshopGroups(): Promise<{ upcoming: Workshop[]; past: Workshop[] }> {
  "use cache";
  cacheLife("hours");
  const workshops = await listWorkshops();
  const now = Date.now();
  const isUpcoming = (w: Workshop) =>
    !w.startsAt || new Date(w.endsAt ?? w.startsAt).getTime() >= now;
  return {
    upcoming: workshops.filter(isUpcoming),
    past: workshops.filter((w) => !isUpcoming(w)).reverse(),
  };
}
