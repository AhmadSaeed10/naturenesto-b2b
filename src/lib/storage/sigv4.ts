import { createHash, createHmac } from "node:crypto";

// AWS Signature Version 4 for S3 compatible storage (Neon Object Storage, Cloudflare R2,
// Backblaze B2, AWS S3). Small enough to own, so the project needs no AWS SDK.

const sha256 = (value: string): string => createHash("sha256").update(value).digest("hex");
const hmac = (key: Buffer | string, value: string): Buffer =>
  createHmac("sha256", key).update(value).digest();

/** RFC 3986 encoding, as SigV4 requires (encodeURIComponent leaves !'()* alone). */
const encode = (value: string): string =>
  encodeURIComponent(value).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );

export interface SigningKey {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

export interface SignedRequest {
  method: "GET" | "PUT" | "DELETE";
  /** Host (and port), exactly as sent in the Host header. */
  host: string;
  /** Absolute path, already URI encoded per segment. */
  path: string;
  /** Extra headers to sign (lower case names), for example content-type. */
  headers?: Record<string, string>;
  /** Seconds the URL stays valid. */
  expires: number;
  /** Override for tests. */
  now?: Date;
}

const stamp = (now: Date): { date: string; time: string } => {
  const time = now
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
  return { date: time.slice(0, 8), time };
};

function signingKey(secret: string, date: string, region: string): Buffer {
  return hmac(hmac(hmac(hmac(`AWS4${secret}`, date), region), "s3"), "aws4_request");
}

/** A pre-signed URL: whoever holds it can perform the one request until it expires. */
export function presign(key: SigningKey, request: SignedRequest): string {
  const { date, time } = stamp(request.now ?? new Date());
  const scope = `${date}/${key.region}/s3/aws4_request`;
  const headers: Record<string, string> = { host: request.host, ...request.headers };
  const names = Object.keys(headers).sort();
  const signedHeaders = names.join(";");

  const query: Record<string, string> = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${key.accessKeyId}/${scope}`,
    "X-Amz-Date": time,
    "X-Amz-Expires": String(request.expires),
    "X-Amz-SignedHeaders": signedHeaders,
  };
  const canonicalQuery = Object.keys(query)
    .sort()
    .map((name) => `${encode(name)}=${encode(query[name] ?? "")}`)
    .join("&");
  const canonicalHeaders = names
    .map((name) => `${name}:${(headers[name] ?? "").trim()}\n`)
    .join("");
  const canonicalRequest = [
    request.method,
    request.path,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    "UNSIGNED-PAYLOAD",
  ].join("\n");
  const toSign = ["AWS4-HMAC-SHA256", time, scope, sha256(canonicalRequest)].join("\n");
  const signature = createHmac("sha256", signingKey(key.secretAccessKey, date, key.region))
    .update(toSign)
    .digest("hex");
  return `https://${request.host}${request.path}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}
