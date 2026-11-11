"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { ACCESS, staffWithRole } from "@/lib/auth/staff";
import {
  HOME_SECTION_ORDER,
  type HomeSectionType,
  isHomeSectionType,
  sectionSchemas,
} from "@/lib/cms/sections";
import { CMS_TAGS } from "@/lib/cms/tags";
import { type Transaction, withActor } from "@/lib/db";
import { pageSectionDrafts, pageSections, pages } from "@/lib/db/schema";

export type SectionResult =
  { ok: true } | { ok: false; error: "invalid" | "forbidden" | "failed"; paths?: string[] };

async function sectionRow(tx: Transaction, type: HomeSectionType) {
  const [page] = await tx
    .select({ id: pages.id })
    .from(pages)
    .where(eq(pages.handle, "home"))
    .limit(1);
  if (!page) return null;
  const [row] = await tx
    .select({ id: pageSections.id, status: pageSections.status, draft: pageSectionDrafts.data })
    .from(pageSections)
    .leftJoin(pageSectionDrafts, eq(pageSectionDrafts.sectionId, pageSections.id))
    .where(and(eq(pageSections.pageId, page.id), eq(pageSections.type, type)))
    .limit(1);
  return {
    pageId: page.id,
    row: row ? { id: row.id, status: row.status, draft: row.draft ?? null } : null,
  };
}

function refresh(type: HomeSectionType) {
  revalidatePath("/admin/content");
  revalidatePath(`/admin/content/home/${type}`);
}

/** Saves edits as a draft; the live homepage keeps showing the published data. */
export async function saveSectionDraft(type: string, data: unknown): Promise<SectionResult> {
  const actor = await staffWithRole(ACCESS.content);
  if (!actor) return { ok: false, error: "forbidden" };
  if (!isHomeSectionType(type)) return { ok: false, error: "invalid" };
  const parsed = sectionSchemas[type].safeParse(data);
  if (!parsed.success) {
    return {
      ok: false,
      error: "invalid",
      paths: parsed.error.issues.map((issue) => issue.path.join(".")),
    };
  }
  const draft = parsed.data as unknown as Record<string, unknown>;

  try {
    const done = await withActor(actor.id, async (tx) => {
      const found = await sectionRow(tx, type);
      if (!found) return false;
      let sectionId = found.row?.id;
      if (!sectionId) {
        // A section missing from the seed starts hidden, with the draft as its data.
        const [created] = await tx
          .insert(pageSections)
          .values({
            pageId: found.pageId,
            type,
            position: HOME_SECTION_ORDER.indexOf(type),
            data: draft,
            status: "draft",
          })
          .returning({ id: pageSections.id });
        sectionId = created?.id;
      }
      if (!sectionId) return false;
      await tx
        .insert(pageSectionDrafts)
        .values({ sectionId, data: draft })
        .onConflictDoUpdate({ target: pageSectionDrafts.sectionId, set: { data: draft } });
      return true;
    });
    if (!done) return { ok: false, error: "failed" };
  } catch (error) {
    console.error("[content] draft save failed", error instanceof Error ? error.message : error);
    return { ok: false, error: "failed" };
  }
  refresh(type);
  return { ok: true };
}

export async function publishSection(type: string): Promise<SectionResult> {
  const actor = await staffWithRole(ACCESS.content);
  if (!actor) return { ok: false, error: "forbidden" };
  if (!isHomeSectionType(type)) return { ok: false, error: "invalid" };
  try {
    const result = await withActor(actor.id, async (tx): Promise<SectionResult> => {
      const found = await sectionRow(tx, type);
      if (!found?.row?.draft) return { ok: false, error: "invalid" };
      // Re-validate on publish: the schema may have tightened since the draft was saved.
      if (!sectionSchemas[type].safeParse(found.row.draft).success)
        return { ok: false, error: "invalid" };
      await tx
        .update(pageSections)
        .set({ data: found.row.draft })
        .where(eq(pageSections.id, found.row.id));
      await tx.delete(pageSectionDrafts).where(eq(pageSectionDrafts.sectionId, found.row.id));
      return { ok: true };
    });
    if (!result.ok) return result;
  } catch {
    return { ok: false, error: "failed" };
  }
  revalidateTag(CMS_TAGS.home, "max");
  refresh(type);
  return { ok: true };
}

export async function discardSectionDraft(type: string): Promise<SectionResult> {
  const actor = await staffWithRole(ACCESS.content);
  if (!actor) return { ok: false, error: "forbidden" };
  if (!isHomeSectionType(type)) return { ok: false, error: "invalid" };
  try {
    const result = await withActor(actor.id, async (tx): Promise<SectionResult> => {
      const found = await sectionRow(tx, type);
      if (!found?.row) return { ok: false, error: "invalid" };
      await tx.delete(pageSectionDrafts).where(eq(pageSectionDrafts.sectionId, found.row.id));
      return { ok: true };
    });
    if (!result.ok) return result;
  } catch {
    return { ok: false, error: "failed" };
  }
  refresh(type);
  return { ok: true };
}

/** Hidden sections keep status draft, which the public cannot read. */
export async function setSectionVisible(type: string, visible: boolean): Promise<SectionResult> {
  const actor = await staffWithRole(ACCESS.content);
  if (!actor) return { ok: false, error: "forbidden" };
  if (!isHomeSectionType(type)) return { ok: false, error: "invalid" };
  try {
    const result = await withActor(actor.id, async (tx): Promise<SectionResult> => {
      const found = await sectionRow(tx, type);
      if (!found?.row) return { ok: false, error: "invalid" };
      await tx
        .update(pageSections)
        .set({ status: visible ? "published" : "draft" })
        .where(eq(pageSections.id, found.row.id));
      return { ok: true };
    });
    if (!result.ok) return result;
  } catch {
    return { ok: false, error: "failed" };
  }
  revalidateTag(CMS_TAGS.home, "max");
  refresh(type);
  return { ok: true };
}
