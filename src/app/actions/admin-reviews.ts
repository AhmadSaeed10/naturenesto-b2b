"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { ACCESS, staffWithRole } from "@/lib/auth/staff";
import { reviewsTag } from "@/lib/commerce/reviews";
import { withActor } from "@/lib/db";
import { productReviews } from "@/lib/db/schema";

const input = z.object({
  id: z.uuid(),
  op: z.enum(["hide", "show", "delete"]),
});

/** Form action for the reviews table: hide, show again, or delete one review. */
export async function moderateReview(formData: FormData): Promise<void> {
  const actor = await staffWithRole(ACCESS.reviews);
  if (!actor) return;
  const parsed = input.safeParse({ id: formData.get("id"), op: formData.get("op") });
  if (!parsed.success) return;
  const { id, op } = parsed.data;

  const handle = await withActor(actor.id, async (tx) => {
    const [row] = await tx
      .select({ handle: productReviews.handle })
      .from(productReviews)
      .where(eq(productReviews.id, id))
      .limit(1);
    if (!row) return null;
    if (op === "delete") {
      await tx.delete(productReviews).where(eq(productReviews.id, id));
    } else {
      await tx
        .update(productReviews)
        .set({ status: op === "hide" ? "hidden" : "published" })
        .where(eq(productReviews.id, id));
    }
    return row.handle;
  });
  if (handle) updateTag(reviewsTag(handle));
  revalidatePath("/admin/reviews");
}
