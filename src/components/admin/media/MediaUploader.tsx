"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useId, useState } from "react";
import { createMediaAsset, createUploadTarget } from "@/app/actions/admin-media";
import { FloatingField } from "@/components/forms/FloatingField";
import { Button } from "@/components/ui/Button";
import { admin } from "@/content/admin";
import {
  MEDIA_MAX_BYTES,
  MEDIA_MAX_EDGE,
  MEDIA_TYPES,
  type MediaType,
  isMediaType,
} from "@/lib/media-rules";

const copy = admin.media.upload;
type UploadError = keyof typeof copy.errors;
// Resized output: WebP keeps photos small with no visible loss at this quality.
const RESIZED_TYPE = "image/webp";
const RESIZED_QUALITY = 0.86;
// Only photos are resized; GIF would lose animation and AVIF and WebP are already compact.
const RESIZABLE: readonly MediaType[] = ["image/jpeg", "image/png"];

interface Prepared {
  blob: Blob;
  type: MediaType;
  width: number;
  height: number;
}

/** Reads the dimensions and scales very large photos down before they leave the browser. */
async function prepare(file: File, type: MediaType): Promise<Prepared> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;
  const scale = Math.min(1, MEDIA_MAX_EDGE / Math.max(width, height));
  if (scale === 1 || !RESIZABLE.includes(type)) {
    bitmap.close();
    return { blob: file, type, width, height };
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, RESIZED_TYPE, RESIZED_QUALITY),
  );
  if (!blob) return { blob: file, type, width, height };
  return { blob, type: RESIZED_TYPE, width: canvas.width, height: canvas.height };
}

export function MediaUploader() {
  const router = useRouter();
  const decorativeId = useId();
  const [pending, setPending] = useState(false);
  const [decorative, setDecorative] = useState(false);
  const [error, setError] = useState<UploadError | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get("file");
    const alt = String(data.get("alt") ?? "").trim();
    const title = String(data.get("title") ?? "").trim();
    setDone(false);

    if (!(file instanceof File) || file.size === 0) return setError("file");
    if (!isMediaType(file.type)) return setError("type");
    if (file.size > MEDIA_MAX_BYTES) return setError("size");
    if (!decorative && !alt) return setError("alt");

    setError(null);
    setPending(true);
    try {
      const prepared = await prepare(file, file.type);
      const target = await createUploadTarget({
        mimeType: prepared.type,
        sizeBytes: prepared.blob.size,
      });
      if (!target.ok) throw new Error(target.error);
      const path = target.path;
      const upload = await fetch(target.url, {
        method: "PUT",
        headers: { "Content-Type": prepared.type },
        body: prepared.blob,
      });
      if (!upload.ok) throw new Error(`upload refused (${upload.status})`);

      const result = await createMediaAsset({
        storagePath: path,
        mimeType: prepared.type,
        width: prepared.width,
        height: prepared.height,
        sizeBytes: prepared.blob.size,
        title: title || file.name.replace(/\.[^.]+$/, ""),
        alt,
        decorative,
      });
      if (!result.ok) throw new Error(result.error);

      form.reset();
      setDecorative(false);
      setDone(true);
      router.refresh();
    } catch (cause) {
      console.error("[media] upload failed", cause);
      setError("upload");
    } finally {
      setPending(false);
    }
  }

  const message = error ? copy.errors[error] : done ? copy.done : "";

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2" noValidate>
      <div className="flex flex-col gap-2 md:col-span-2">
        <label htmlFor="media-file" className="text-sm font-medium">
          {copy.file}
        </label>
        <input
          id="media-file"
          name="file"
          type="file"
          accept={MEDIA_TYPES.join(",")}
          required
          aria-describedby="media-file-hint"
          aria-invalid={error === "file" || error === "type" || error === "size" ? true : undefined}
          className="block w-full rounded-2xl border border-ink-muted bg-background px-4 py-3 text-sm file:mr-4 file:min-h-(--size-tap) file:rounded-pill file:border-0 file:bg-surface file:px-4 file:text-ink"
        />
        <p id="media-file-hint" className="text-sm text-ink-muted">
          {copy.fileHint}
        </p>
      </div>
      <FloatingField name="title" label={copy.name} />
      <FloatingField
        name="alt"
        label={copy.alt}
        hint={copy.altHint}
        required={!decorative}
        error={error === "alt" ? copy.errors.alt : undefined}
      />
      <div className="flex min-h-(--size-tap) items-center gap-3 md:col-span-2">
        <input
          id={decorativeId}
          type="checkbox"
          checked={decorative}
          onChange={(event) => setDecorative(event.target.checked)}
          className="size-5 accent-primary-dark"
        />
        <label htmlFor={decorativeId}>{copy.decorative}</label>
      </div>
      <div className="flex flex-wrap items-center gap-4 md:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? copy.pending : copy.submit}
        </Button>
        <p role="status" aria-live="polite" className="text-sm">
          {message}
        </p>
      </div>
    </form>
  );
}
