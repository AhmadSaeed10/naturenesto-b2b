import "server-only";
import { count, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { productReviews } from "@/lib/db/schema";

export const REVIEWS_PAGE_SIZE = 20;

export interface ReviewRow {
  id: string;
  handle: string;
  rating: number;
  title: string;
  body: string;
  author: string;
  status: string;
  createdAt: Date;
}

export async function listReviews(page: number): Promise<{
  rows: ReviewRow[];
  page: number;
  pageCount: number;
}> {
  const [{ total = 0 } = {}] = await db().select({ total: count() }).from(productReviews);
  const pageCount = Math.max(1, Math.ceil(total / REVIEWS_PAGE_SIZE));
  const current = Math.min(Math.max(1, page), pageCount);
  const rows = await db()
    .select()
    .from(productReviews)
    .orderBy(desc(productReviews.createdAt))
    .limit(REVIEWS_PAGE_SIZE)
    .offset((current - 1) * REVIEWS_PAGE_SIZE);
  return {
    rows: rows.map((row) => ({
      id: row.id,
      handle: row.handle,
      rating: row.rating,
      title: row.title,
      body: row.body,
      author: row.authorName,
      status: row.status,
      createdAt: row.createdAt,
    })),
    page: current,
    pageCount,
  };
}
