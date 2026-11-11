"use client";

import { useActionState, useId, useState } from "react";
import { submitReview } from "@/app/actions/reviews";
import { Button } from "@/components/ui/Button";
import { commerce } from "@/content/commerce";
import { REVIEW_IDLE } from "@/lib/review-form";
import { cn } from "@/lib/utils";

const copy = commerce.product.reviews;
const FIELD =
  "min-h-(--size-tap) w-full rounded-xl border bg-background px-4 py-3 text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark";

export function ReviewForm({ handle }: { handle: string }) {
  const uid = useId();
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(submitReview, REVIEW_IDLE);
  const [rating, setRating] = useState(Number(state.values.rating) || 0);
  const done = state.status === "done";

  if (!open && !done) {
    return (
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        {copy.write}
      </Button>
    );
  }
  if (done) {
    return (
      <p role="status" className="font-medium text-primary-dark">
        {copy.thanks}
      </p>
    );
  }

  const message =
    state.status === "invalid"
      ? copy.invalid
      : state.status === "limited"
        ? copy.limited
        : state.status === "failed"
          ? copy.failed
          : "";

  return (
    <form action={action} noValidate className="flex max-w-xl flex-col gap-5">
      <h3 className="text-h4">{copy.formTitle}</h3>
      <input type="hidden" name="handle" value={handle} />
      {/* Honeypot, hidden from people and assistive tech. */}
      <div aria-hidden="true" className="absolute -left-[9999px]">
        <input name="company" tabIndex={-1} autoComplete="off" />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-small font-medium">
          {copy.rating} <span className="font-normal text-ink-muted">({copy.ratingHint})</span>
        </legend>
        <div className="flex gap-1" aria-invalid={state.errors.rating ? true : undefined}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label
              key={n}
              className="relative inline-flex size-11 cursor-pointer items-center justify-center has-focus-visible:outline-2 has-focus-visible:outline-primary-dark"
            >
              <input
                type="radio"
                name="rating"
                value={n}
                checked={rating === n}
                onChange={() => setRating(n)}
                aria-label={copy.starLabel(n)}
                className="peer sr-only"
              />
              <svg
                viewBox="0 0 24 24"
                className={cn(
                  "size-8 transition-colors duration-(--duration-micro)",
                  n <= rating ? "text-primary-dark" : "text-line",
                )}
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="m12 2.8 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.7l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9z" />
              </svg>
            </label>
          ))}
        </div>
        {state.errors.rating ? <p className="text-small text-ink">{copy.ratingHint}</p> : null}
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${uid}-name`} className="text-small font-medium">
          {copy.name}
        </label>
        <input
          id={`${uid}-name`}
          name="name"
          maxLength={80}
          autoComplete="name"
          defaultValue={state.values.name}
          aria-invalid={state.errors.name ? true : undefined}
          className={cn(FIELD, state.errors.name ? "border-ink" : "border-line")}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${uid}-title`} className="text-small font-medium">
          {copy.headline}
        </label>
        <input
          id={`${uid}-title`}
          name="title"
          maxLength={120}
          defaultValue={state.values.title}
          className={cn(FIELD, "border-line")}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${uid}-body`} className="text-small font-medium">
          {copy.body} <span className="font-normal text-ink-muted">({copy.bodyHint})</span>
        </label>
        <textarea
          id={`${uid}-body`}
          name="body"
          rows={5}
          maxLength={2000}
          defaultValue={state.values.body}
          aria-invalid={state.errors.body ? true : undefined}
          className={cn(FIELD, state.errors.body ? "border-ink" : "border-line")}
        />
      </div>

      <p role="status" aria-live="polite" className="text-small empty:hidden">
        {message}
      </p>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? copy.sending : copy.submit}
        </Button>
        <Button type="button" variant="link" onClick={() => setOpen(false)}>
          {copy.cancel}
        </Button>
      </div>
    </form>
  );
}
