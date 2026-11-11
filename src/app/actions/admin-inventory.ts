"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { ACCESS, staffWithRole } from "@/lib/auth/staff";
import { sql } from "drizzle-orm";
import { withActor } from "@/lib/db";
import { ENUMS } from "@/lib/db/enums";

export interface AdjustState {
  status: "idle" | "done" | "delta" | "forbidden" | "failed";
  stock?: number;
}

const schema = z.object({
  variantId: z.uuid(),
  delta: z.coerce
    .number()
    .int()
    .min(-1_000_000)
    .max(1_000_000)
    .refine((n) => n !== 0),
  // "initial" and "import" are set by the editor and CSV import, not by hand.
  reason: z.enum(ENUMS.stock_reason).refine((r) => r !== "initial" && r !== "import"),
  note: z.string().trim().max(300),
});

export async function adjustStock(
  _previous: AdjustState,
  formData: FormData,
): Promise<AdjustState> {
  const actor = await staffWithRole(ACCESS.catalog);
  if (!actor) return { status: "forbidden" };
  const parsed = schema.safeParse({
    variantId: formData.get("variantId"),
    delta: formData.get("delta"),
    reason: formData.get("reason"),
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) return { status: "delta" };

  let stock: number;
  try {
    // adjust_stock logs the change with the actor and refuses a negative result.
    stock = await withActor(actor.id, async (tx) => {
      const result = await tx.execute<{ stock: number }>(
        sql`select public.adjust_stock(${parsed.data.variantId}::uuid, ${parsed.data.delta}, ${parsed.data.reason}::public.stock_reason, ${parsed.data.note}) as stock`,
      );
      return Number(result.rows[0]?.stock);
    });
  } catch (error) {
    console.error("[inventory] adjust failed", error instanceof Error ? error.message : error);
    return { status: (error as { code?: string }).code === "42501" ? "forbidden" : "failed" };
  }
  // Stock decides "out of stock" on the storefront.
  revalidateTag("products", "max");
  revalidatePath("/admin/inventory");
  return { status: "done", stock };
}
