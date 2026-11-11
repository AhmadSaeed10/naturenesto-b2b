import "server-only";
import { MEDIA_PAGE_SIZE } from "@/lib/media-rules";
import { mediaUrl } from "@/lib/media";
import { desc, ilike, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { mediaAssets } from "@/lib/db/schema";

export interface MediaItem {
  id: string;
  url: string;
  title: string | null;
  alt: string;
  decorative: boolean;
  width: number | null;
  height: number | null;
  mimeType: string | null;
  isExternal: boolean;
  uses: number;
}

export interface MediaPage {
  items: MediaItem[];
  total: number;
  page: number;
  pageCount: number;
}

/** Search terms keep letters, numbers, spaces and simple punctuation only: no LIKE wildcards. */
export const cleanSearch = (value: string): string =>
  value
    .replace(/[^\p{L}\p{N}\s.'-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);

export async function listMedia({
  query,
  page,
}: {
  query: string;
  page: number;
}): Promise<MediaPage> {
  const from = (page - 1) * MEDIA_PAGE_SIZE;
  const term = cleanSearch(query);
  const where = term
    ? or(ilike(mediaAssets.title, `%${term}%`), ilike(mediaAssets.alt, `%${term}%`))
    : undefined;

  const [data, [counted]] = await Promise.all([
    db()
      .select()
      .from(mediaAssets)
      .where(where)
      .orderBy(desc(mediaAssets.createdAt))
      .limit(MEDIA_PAGE_SIZE)
      .offset(from),
    db()
      .select({ n: sql<number>`count(*)::int` })
      .from(mediaAssets)
      .where(where),
  ]);

  const ids = data.map((row) => row.id);
  const usage = ids.length
    ? await db().execute<{ media_id: string; uses: string }>(
        sql`select media_id, uses from public.media_usage(array[${sql.join(
          ids.map((id) => sql`${id}::uuid`),
          sql`, `,
        )}]::uuid[])`,
      )
    : { rows: [] };
  const usesById = new Map(usage.rows.map((row) => [row.media_id, Number(row.uses)]));

  const total = counted?.n ?? 0;
  return {
    items: data.map((row) => ({
      id: row.id,
      url: mediaUrl(row),
      title: row.title,
      alt: row.alt,
      decorative: row.decorative,
      width: row.width,
      height: row.height,
      mimeType: row.mimeType,
      isExternal: row.externalUrl !== null,
      uses: usesById.get(row.id) ?? 0,
    })),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / MEDIA_PAGE_SIZE)),
  };
}

/** Lightweight list for pickers (logo, covers): newest first, images with a usable URL. */
export async function listMediaOptions(): Promise<{ id: string; label: string }[]> {
  const rows = await db()
    .select({
      id: mediaAssets.id,
      title: mediaAssets.title,
      alt: mediaAssets.alt,
      storagePath: mediaAssets.storagePath,
      externalUrl: mediaAssets.externalUrl,
    })
    .from(mediaAssets)
    .orderBy(desc(mediaAssets.createdAt))
    .limit(200);
  return rows.map((row) => ({
    id: row.id,
    label: row.title || row.alt || row.storagePath || row.externalUrl || row.id,
  }));
}
