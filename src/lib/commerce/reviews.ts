import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/lib/db";
import { productReviews } from "@/lib/db/schema";

export interface StoreReview {
  id: string;
  rating: number;
  title: string;
  body: string;
  author: string;
  createdAt: string;
}

export interface ReviewSummary {
  count: number;
  /** One decimal, 0 when there are no reviews. */
  average: number;
  /** Reviews per star, index 0 is one star. */
  distribution: [number, number, number, number, number];
}

export interface ProductReviews {
  summary: ReviewSummary;
  reviews: StoreReview[];
}

export const reviewsTag = (handle: string): string => `reviews:${handle}`;

const EMPTY: ProductReviews = {
  summary: { count: 0, average: 0, distribution: [0, 0, 0, 0, 0] },
  reviews: [],
};
const LIST_LIMIT = 50;

/** Published reviews for a product handle, newest first, with the star summary. */
export async function getProductReviews(handle: string): Promise<ProductReviews> {
  "use cache";
  cacheLife("hours");
  cacheTag(reviewsTag(handle));
  if (!isDatabaseConfigured()) return EMPTY;
  const where = and(eq(productReviews.handle, handle), eq(productReviews.status, "published"));
  const [rows, stars] = await Promise.all([
    db()
      .select()
      .from(productReviews)
      .where(where)
      .orderBy(desc(productReviews.createdAt))
      .limit(LIST_LIMIT),
    db()
      .select({ rating: productReviews.rating, n: sql<number>`count(*)::int` })
      .from(productReviews)
      .where(where)
      .groupBy(productReviews.rating),
  ]);
  const distribution: ReviewSummary["distribution"] = [0, 0, 0, 0, 0];
  let total = 0;
  let sum = 0;
  for (const { rating, n } of stars) {
    if (rating < 1 || rating > 5) continue;
    distribution[rating - 1] = n;
    total += n;
    sum += rating * n;
  }
  return {
    summary: {
      count: total,
      average: total ? Math.round((sum / total) * 10) / 10 : 0,
      distribution,
    },
    reviews: rows.map((row) => ({
      id: row.id,
      rating: row.rating,
      title: row.title,
      body: row.body,
      author: row.authorName,
      createdAt: row.createdAt.toISOString(),
    })),
  };
}
