"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ACCESS, staffWithRole } from "@/lib/auth/staff";
import { eq, sql } from "drizzle-orm";
import { db, withActor } from "@/lib/db";
import { mediaAssets } from "@/lib/db/schema";
import { MEDIA_EXTENSIONS, MEDIA_MAX_BYTES, MEDIA_TEXT_MAX, MEDIA_TYPES } from "@/lib/media-rules";
import { deleteObject, signedUploadUrl, storageConfigured } from "@/lib/storage";

export type MediaActionResult =
  { ok: true } | { ok: false; error: "invalid" | "forbidden" | "in_use" | "failed" };

export type UploadTargetResult =
  | { ok: true; url: string; path: string }
  | { ok: false; error: "invalid" | "forbidden" | "notConfigured" };

const targetSchema = z.object({
  mimeType: z.enum(MEDIA_TYPES),
  sizeBytes: z.number().int().positive().max(MEDIA_MAX_BYTES),
});

/** Gives the browser a short lived signed URL to upload one image straight to the bucket. */
export async function createUploadTarget(
  input: z.input<typeof targetSchema>,
): Promise<UploadTargetResult> {
  if (!(await staffWithRole(ACCESS.media))) return { ok: false, error: "forbidden" };
  const parsed = targetSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  if (!storageConfigured()) return { ok: false, error: "notConfigured" };

  const now = new Date();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const path = `${now.getUTCFullYear()}/${month}/${crypto.randomUUID()}.${MEDIA_EXTENSIONS[parsed.data.mimeType]}`;
  const url = signedUploadUrl(path, parsed.data.mimeType);
  return url ? { ok: true, url, path } : { ok: false, error: "notConfigured" };
}

const MEDIA_PATH = "/admin/media";

// Alt text is required unless the image is decorative, matching the database constraint.
const details = z
  .object({
    title: z.string().trim().max(MEDIA_TEXT_MAX).optional(),
    alt: z.string().trim().max(MEDIA_TEXT_MAX),
    decorative: z.boolean(),
  })
  .refine((value) => value.decorative || value.alt.length > 0, { path: ["alt"] });

const createSchema = details.and(
  z.object({
    // Objects are written by the uploader under year/month/uuid.ext.
    storagePath: z.string().regex(/^\d{4}\/\d{2}\/[0-9a-f-]{36}\.(avif|webp|png|jpg|gif)$/),
    mimeType: z.enum(MEDIA_TYPES),
    width: z.number().int().positive().max(20000),
    height: z.number().int().positive().max(20000),
    sizeBytes: z.number().int().positive().max(MEDIA_MAX_BYTES),
  }),
);

export type CreateMediaInput = z.input<typeof createSchema>;

/** Records an image the browser has already uploaded to the bucket. */
export async function createMediaAsset(input: CreateMediaInput): Promise<MediaActionResult> {
  const actor = await staffWithRole(ACCESS.media);
  if (!actor) return { ok: false, error: "forbidden" };
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const value = parsed.data;

  try {
    await withActor(actor.id, (tx) =>
      tx.insert(mediaAssets).values({
        storagePath: value.storagePath,
        mimeType: value.mimeType,
        width: value.width,
        height: value.height,
        sizeBytes: value.sizeBytes,
        title: value.title || null,
        alt: value.decorative ? "" : value.alt,
        decorative: value.decorative,
      }),
    );
  } catch (error) {
    console.error("[media] insert failed", error instanceof Error ? error.message : error);
    // Do not leave an orphaned file behind.
    await deleteObject(value.storagePath);
    return { ok: false, error: "failed" };
  }
  revalidatePath(MEDIA_PATH);
  return { ok: true };
}

const updateSchema = details.and(z.object({ id: z.uuid() }));

export async function updateMediaAsset(
  _previous: MediaActionResult | null,
  formData: FormData,
): Promise<MediaActionResult> {
  const actor = await staffWithRole(ACCESS.media);
  if (!actor) return { ok: false, error: "forbidden" };
  const parsed = updateSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title") ?? undefined,
    alt: formData.get("alt") ?? "",
    decorative: formData.get("decorative") === "on",
  });
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { id, title, alt, decorative } = parsed.data;

  try {
    await withActor(actor.id, (tx) =>
      tx
        .update(mediaAssets)
        .set({ title: title || null, alt: decorative ? "" : alt, decorative })
        .where(eq(mediaAssets.id, id)),
    );
  } catch {
    return { ok: false, error: "failed" };
  }
  revalidatePath(MEDIA_PATH);
  return { ok: true };
}

export async function deleteMediaAsset(id: string): Promise<MediaActionResult> {
  const actor = await staffWithRole(ACCESS.media);
  if (!actor) return { ok: false, error: "forbidden" };
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const [asset] = await db()
    .select({ storagePath: mediaAssets.storagePath })
    .from(mediaAssets)
    .where(eq(mediaAssets.id, parsed.data))
    .limit(1);
  if (!asset) return { ok: false, error: "failed" };
  const usage = await db().execute<{ uses: string }>(
    sql`select uses from public.media_usage(array[${parsed.data}]::uuid[])`,
  );
  if (Number(usage.rows[0]?.uses ?? 0) > 0) return { ok: false, error: "in_use" };

  try {
    await withActor(actor.id, (tx) =>
      tx.delete(mediaAssets).where(eq(mediaAssets.id, parsed.data)),
    );
  } catch (error) {
    // A foreign key still guards against a reference added since the check.
    return {
      ok: false,
      error: (error as { code?: string }).code === "23503" ? "in_use" : "failed",
    };
  }
  if (asset.storagePath) await deleteObject(asset.storagePath);
  revalidatePath(MEDIA_PATH);
  return { ok: true };
}
