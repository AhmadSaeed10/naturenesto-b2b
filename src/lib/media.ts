export interface MediaSource {
  externalUrl: string | null;
  storagePath: string | null;
}

/**
 * Public base URL of the media bucket (S3 compatible storage with public reads), no trailing
 * slash. Read with a literal env access so it is also available to the browser.
 */
const mediaBase = (): string => (process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? "").replace(/\/+$/, "");

/** Public URL for a media asset: a file served by the site, or an object in the bucket. */
export function mediaUrl(media: MediaSource): string {
  if (media.externalUrl) return media.externalUrl;
  const base = mediaBase();
  return base && media.storagePath ? `${base}/${media.storagePath}` : "";
}

/** Order and cart snapshots store either a site path, a full URL, or a bucket path. */
export function storedImageUrl(value: string | null): string | null {
  if (!value) return null;
  if (value.startsWith("/") || value.startsWith("https://")) return value;
  return mediaUrl({ externalUrl: null, storagePath: value }) || null;
}
