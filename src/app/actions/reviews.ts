"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { reviewsTag } from "@/lib/commerce/reviews";
import { db } from "@/lib/db";
import { productReviews } from "@/lib/db/schema";
import { REVIEW_IDLE, type ReviewState } from "@/lib/review-form";
import { RATE_LIMITS, clientIp, withinRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  handle: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]{1,120}$/),
  name: z.string().trim().min(1).max(80),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(120),
  body: z.string().trim().min(10).max(2000),
});

const text = (data: FormData, key: string): string => {
  const value = data.get(key);
  return typeof value === "string" ? value : "";
};

/** Public review form. Publishes at once; staff can hide or delete from the admin. */
export async function submitReview(_previous: ReviewState, data: FormData): Promise<ReviewState> {
  const values = {
    name: text(data, "name"),
    rating: text(data, "rating"),
    title: text(data, "title"),
    body: text(data, "body"),
  };
  // Honeypot: a real visitor never sees this field. Answer like a success so bots learn nothing.
  if (text(data, "company")) return { status: "done", errors: {}, values: REVIEW_IDLE.values };

  const parsed = schema.safeParse({ handle: text(data, "handle"), ...values });
  if (!parsed.success) {
    const errors: ReviewState["errors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "name" || key === "rating" || key === "body") errors[key] = true;
    }
    return { status: "invalid", errors, values };
  }

  if (!(await withinRateLimit(RATE_LIMITS.review, await clientIp()))) {
    return { status: "limited", errors: {}, values };
  }

  try {
    await db().insert(productReviews).values({
      handle: parsed.data.handle,
      rating: parsed.data.rating,
      title: parsed.data.title,
      body: parsed.data.body,
      authorName: parsed.data.name,
    });
  } catch (error) {
    console.error("[reviews] insert failed", error instanceof Error ? error.message : error);
    return { status: "failed", errors: {}, values };
  }
  updateTag(reviewsTag(parsed.data.handle));
  return { status: "done", errors: {}, values: REVIEW_IDLE.values };
}
