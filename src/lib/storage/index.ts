import "server-only";
import { type SigningKey, presign } from "./sigv4";

// Media files live in an S3 compatible bucket with public reads (Neon Object Storage,
// Cloudflare R2 and others work the same way). Browsers upload straight to the bucket with a
// short lived signed URL from the server, so files never pass through a serverless function.

interface StorageConfig {
  key: SigningKey;
  host: string;
  bucket: string;
}

function config(): StorageConfig | null {
  const endpoint = process.env.S3_ENDPOINT;
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) return null;
  try {
    return {
      host: new URL(endpoint).host,
      bucket,
      key: { accessKeyId, secretAccessKey, region: process.env.S3_REGION ?? "auto" },
    };
  } catch {
    return null;
  }
}

/** Uploads need the bucket and a public base URL to show what was uploaded. */
export const storageConfigured = (): boolean =>
  config() !== null && Boolean(process.env.NEXT_PUBLIC_MEDIA_BASE_URL);

const objectPath = (cfg: StorageConfig, path: string): string =>
  `/${cfg.bucket}/${path.split("/").map(encodeURIComponent).join("/")}`;

const UPLOAD_URL_SECONDS = 5 * 60;

/** A URL the browser can PUT one file to, bound to its content type. Null when not configured. */
export function signedUploadUrl(path: string, contentType: string): string | null {
  const cfg = config();
  if (!cfg) return null;
  return presign(cfg.key, {
    method: "PUT",
    host: cfg.host,
    path: objectPath(cfg, path),
    headers: { "content-type": contentType },
    expires: UPLOAD_URL_SECONDS,
  });
}

/** Removes an object. Failures are logged, never thrown: an orphaned file is harmless. */
export async function deleteObject(path: string): Promise<void> {
  const cfg = config();
  if (!cfg) return;
  try {
    const url = presign(cfg.key, {
      method: "DELETE",
      host: cfg.host,
      path: objectPath(cfg, path),
      expires: 60,
    });
    const response = await fetch(url, { method: "DELETE" });
    if (!response.ok && response.status !== 404) {
      console.error("[storage] delete refused", response.status, path);
    }
  } catch (error) {
    console.error("[storage] delete failed", error instanceof Error ? error.message : error);
  }
}
