"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { ACCESS, staffWithRole } from "@/lib/auth/staff";
import { RESERVED_HANDLES } from "@/lib/cms/reserved";
import { RICH_TEXT_MAX, toRichText } from "@/lib/cms/rich-text";
import { CMS_TAGS } from "@/lib/cms/tags";
import { HANDLE_PATTERN, toTag } from "@/lib/handle";
import { rupeesToPaisa } from "@/lib/money";
import { and, eq, ne } from "drizzle-orm";
import { withActor } from "@/lib/db";
import { blogPosts, faqItems, pages, workshops } from "@/lib/db/schema";

export type DocResult =
  | { ok: true; id: string }
  | {
      ok: false;
      error: "invalid" | "handleTaken" | "handleReserved" | "forbidden" | "failed";
      fields?: string[];
    };

const handle = z.string().trim().max(100).regex(HANDLE_PATTERN);
// The editor converts datetime-local input (the browser's time zone) to ISO with Z.
const optionalDate = z.union([z.literal(""), z.iso.datetime({ offset: true })]);
const optionalUuid = z.union([z.literal(""), z.uuid()]);
const body = z.string().max(RICH_TEXT_MAX);
const seo = { seoTitle: z.string().trim().max(70), seoDescription: z.string().trim().max(170) };

const fields = (error: z.ZodError) => [
  ...new Set(error.issues.map((issue) => String(issue.path[0]))),
];
const toTimestamp = (value: string): Date | null => (value ? new Date(value) : null);

function dbError(error: unknown): DocResult {
  const { code, message } = error as { code?: string; message?: string };
  if (code === "23505") return { ok: false, error: "handleTaken" };
  if (code === "42501") return { ok: false, error: "forbidden" };
  console.error("[content] save failed", message);
  return { ok: false, error: "failed" };
}

/** Runs one write as the staff member. A write that touches no row (wrong id) is a failure. */
async function write(
  actorId: string,
  run: (tx: Parameters<Parameters<typeof withActor>[1]>[0]) => Promise<{ id: string }[]>,
): Promise<DocResult> {
  try {
    const [saved] = await withActor(actorId, run);
    return saved ? { ok: true, id: saved.id } : { ok: false, error: "failed" };
  } catch (error) {
    return dbError(error);
  }
}

// Pages -----------------------------------------------------------------------------------

const pageSchema = z.object({
  id: optionalUuid,
  title: z.string().trim().min(1).max(160),
  handle,
  body,
  published: z.boolean(),
  ...seo,
});
export type PageInput = z.input<typeof pageSchema>;

export async function savePage(input: PageInput): Promise<DocResult> {
  const actor = await staffWithRole(ACCESS.content);
  if (!actor) return { ok: false, error: "forbidden" };
  const parsed = pageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid", fields: fields(parsed.error) };
  const value = parsed.data;
  // Pages render at /<handle>; a handle owned by a real route would never be reachable.
  if (RESERVED_HANDLES.has(value.handle)) return { ok: false, error: "handleReserved" };

  const row = {
    title: value.title,
    handle: value.handle,
    body: toRichText(value.body) as unknown as Record<string, unknown>,
    status: value.published ? ("published" as const) : ("draft" as const),
    publishedAt: value.published ? new Date() : null,
    seoTitle: value.seoTitle || null,
    seoDescription: value.seoDescription || null,
  };
  const result = await write(actor.id, (tx) =>
    value.id
      ? tx
          .update(pages)
          .set(row)
          .where(and(eq(pages.id, value.id), ne(pages.handle, "home")))
          .returning({ id: pages.id })
      : tx.insert(pages).values(row).returning({ id: pages.id }),
  );
  if (!result.ok) return result;
  revalidateTag(CMS_TAGS.pages, "max");
  revalidatePath("/admin/content/pages");
  return result;
}

// Blog posts -----------------------------------------------------------------------------

const postSchema = z.object({
  id: optionalUuid,
  title: z.string().trim().min(1).max(160),
  handle,
  excerpt: z.string().trim().max(300),
  coverId: optionalUuid,
  tags: z.array(z.string()).max(20),
  body,
  published: z.boolean(),
  publishedAt: optionalDate,
  ...seo,
});
export type PostInput = z.input<typeof postSchema>;

export async function savePost(input: PostInput): Promise<DocResult> {
  const staff = await staffWithRole(ACCESS.content);
  if (!staff) return { ok: false, error: "forbidden" };
  const parsed = postSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid", fields: fields(parsed.error) };
  const value = parsed.data;

  const row = {
    title: value.title,
    handle: value.handle,
    excerpt: value.excerpt || null,
    coverMediaId: value.coverId || null,
    tags: [...new Set(value.tags.map(toTag).filter(Boolean))],
    body: toRichText(value.body) as unknown as Record<string, unknown>,
    status: value.published ? ("published" as const) : ("draft" as const),
    // A future date schedules the post: the storefront hides it until then.
    publishedAt: value.published
      ? (toTimestamp(value.publishedAt) ?? new Date())
      : toTimestamp(value.publishedAt),
    seoTitle: value.seoTitle || null,
    seoDescription: value.seoDescription || null,
  };
  const result = await write(staff.id, (tx) =>
    value.id
      ? tx
          .update(blogPosts)
          .set(row)
          .where(eq(blogPosts.id, value.id))
          .returning({ id: blogPosts.id })
      : tx
          .insert(blogPosts)
          .values({ ...row, authorId: staff.id })
          .returning({ id: blogPosts.id }),
  );
  if (!result.ok) return result;
  revalidateTag(CMS_TAGS.posts, "max");
  revalidatePath("/admin/content/blog");
  return result;
}

// Workshops ------------------------------------------------------------------------------

const workshopSchema = z
  .object({
    id: optionalUuid,
    title: z.string().trim().min(1).max(160),
    handle,
    summary: z.string().trim().max(300),
    coverId: optionalUuid,
    body,
    startsAt: optionalDate,
    endsAt: optionalDate,
    location: z.string().trim().max(200),
    capacity: z.union([z.literal(""), z.coerce.number().int().min(1).max(10_000)]),
    price: z.string().trim().max(20),
    published: z.boolean(),
  })
  .refine((v) => !v.startsAt || !v.endsAt || new Date(v.endsAt) >= new Date(v.startsAt), {
    path: ["endsAt"],
  })
  .refine((v) => v.price === "" || rupeesToPaisa(v.price) !== null, { path: ["price"] });
export type WorkshopInput = z.input<typeof workshopSchema>;

export async function saveWorkshop(input: WorkshopInput): Promise<DocResult> {
  const actor = await staffWithRole(ACCESS.content);
  if (!actor) return { ok: false, error: "forbidden" };
  const parsed = workshopSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid", fields: fields(parsed.error) };
  const value = parsed.data;

  const row = {
    title: value.title,
    handle: value.handle,
    summary: value.summary || null,
    coverMediaId: value.coverId || null,
    body: toRichText(value.body) as unknown as Record<string, unknown>,
    startsAt: toTimestamp(value.startsAt),
    endsAt: toTimestamp(value.endsAt),
    location: value.location || null,
    capacity: value.capacity === "" ? null : value.capacity,
    price: value.price === "" ? null : rupeesToPaisa(value.price),
    status: value.published ? ("published" as const) : ("draft" as const),
    publishedAt: value.published ? new Date() : null,
  };
  const result = await write(actor.id, (tx) =>
    value.id
      ? tx
          .update(workshops)
          .set(row)
          .where(eq(workshops.id, value.id))
          .returning({ id: workshops.id })
      : tx.insert(workshops).values(row).returning({ id: workshops.id }),
  );
  if (!result.ok) return result;
  revalidateTag(CMS_TAGS.workshops, "max");
  revalidatePath("/admin/content/workshops");
  return result;
}

// FAQ ------------------------------------------------------------------------------------

const faqSchema = z.object({
  id: optionalUuid,
  question: z.string().trim().min(1).max(300),
  answer: body.refine((value) => value.trim().length > 0),
  category: z.string().trim().max(80),
  position: z.coerce.number().int().min(0).max(10_000),
  published: z.boolean(),
});
export type FaqInput = z.input<typeof faqSchema>;

export async function saveFaq(input: FaqInput): Promise<DocResult> {
  const actor = await staffWithRole(ACCESS.content);
  if (!actor) return { ok: false, error: "forbidden" };
  const parsed = faqSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid", fields: fields(parsed.error) };
  const value = parsed.data;
  const row = {
    question: value.question,
    answer: toRichText(value.answer) as unknown as Record<string, unknown>,
    category: value.category || null,
    position: value.position,
    status: value.published ? ("published" as const) : ("draft" as const),
  };
  const result = await write(actor.id, (tx) =>
    value.id
      ? tx.update(faqItems).set(row).where(eq(faqItems.id, value.id)).returning({ id: faqItems.id })
      : tx.insert(faqItems).values(row).returning({ id: faqItems.id }),
  );
  if (!result.ok) return result;
  revalidateTag(CMS_TAGS.faq, "max");
  revalidatePath("/admin/content/faq");
  return result;
}

// Delete ---------------------------------------------------------------------------------

const TABLES = {
  pages: { table: pages, tag: CMS_TAGS.pages },
  blog: { table: blogPosts, tag: CMS_TAGS.posts },
  workshops: { table: workshops, tag: CMS_TAGS.workshops },
  faq: { table: faqItems, tag: CMS_TAGS.faq },
} as const;
export type DocKind = keyof typeof TABLES;

export async function deleteDoc(kind: DocKind, id: string): Promise<{ ok: boolean }> {
  const actor = await staffWithRole(ACCESS.content);
  if (!actor) return { ok: false };
  const target = TABLES[kind];
  const parsed = z.uuid().safeParse(id);
  if (!target || !parsed.success) return { ok: false };
  try {
    await withActor(actor.id, (tx) =>
      // The homepage record holds the section blocks and is never deleted from here.
      kind === "pages"
        ? tx.delete(pages).where(and(eq(pages.id, parsed.data), ne(pages.handle, "home")))
        : tx.delete(target.table).where(eq(target.table.id, parsed.data)),
    );
  } catch {
    return { ok: false };
  }
  revalidateTag(target.tag, "max");
  revalidatePath(`/admin/content/${kind}`);
  return { ok: true };
}
