"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { ACCESS, staffWithRole } from "@/lib/auth/staff";
import { href } from "@/lib/cms/sections";
import { CMS_TAGS } from "@/lib/cms/tags";
import { eq } from "drizzle-orm";
import { withActor } from "@/lib/db";
import { navigationItems, redirects } from "@/lib/db/schema";

// Navigation ------------------------------------------------------------------------------

const menuSchema = z.object({
  menuId: z.uuid(),
  items: z.array(z.object({ label: z.string().trim().min(1).max(60), href })).max(30),
});
export type MenuInput = z.input<typeof menuSchema>;

export type MenuResult =
  { ok: true } | { ok: false; error: "invalid" | "forbidden" | "failed"; index?: number };

/** Replaces a menu's links with the given ordered list. */
export async function saveMenu(input: MenuInput): Promise<MenuResult> {
  const actor = await staffWithRole(ACCESS.content);
  if (!actor) return { ok: false, error: "forbidden" };
  const parsed = menuSchema.safeParse(input);
  if (!parsed.success) {
    const index = parsed.error.issues.find((issue) => issue.path[0] === "items")?.path[1];
    return { ok: false, error: "invalid", index: typeof index === "number" ? index : undefined };
  }
  const { menuId, items } = parsed.data;

  try {
    // One transaction: the old links are replaced by the new list, or nothing changes.
    await withActor(actor.id, async (tx) => {
      await tx.delete(navigationItems).where(eq(navigationItems.menuId, menuId));
      if (items.length) {
        await tx.insert(navigationItems).values(
          items.map((item, position) => ({
            menuId,
            label: item.label,
            href: item.href,
            position,
          })),
        );
      }
    });
  } catch (error) {
    console.error("[content] menu save failed", error instanceof Error ? error.message : error);
    return { ok: false, error: "failed" };
  }
  revalidateTag(CMS_TAGS.navigation, "max");
  revalidatePath("/admin/content/navigation");
  return { ok: true };
}

// Redirects (owners and admins) -----------------------------------------------------------

export interface RedirectState {
  status: "idle" | "done" | "invalid" | "taken" | "forbidden" | "failed";
}

const redirectSchema = z.object({
  source: z
    .string()
    .trim()
    .max(300)
    .regex(/^\/[^\s?#]*$/)
    .refine((value) => !value.startsWith("/admin") && !value.startsWith("/api")),
  destination: z
    .string()
    .trim()
    .max(500)
    .regex(/^(\/(?!\/)|https:\/\/)/),
  permanent: z.boolean(),
});

export async function addRedirect(
  _previous: RedirectState,
  formData: FormData,
): Promise<RedirectState> {
  const actor = await staffWithRole(ACCESS.redirects);
  if (!actor) return { status: "forbidden" };
  const parsed = redirectSchema.safeParse({
    source: formData.get("source"),
    destination: formData.get("destination"),
    permanent: formData.get("permanent") === "on",
  });
  if (!parsed.success || parsed.data.source === parsed.data.destination)
    return { status: "invalid" };

  try {
    await withActor(actor.id, (tx) => tx.insert(redirects).values(parsed.data));
  } catch (error) {
    return { status: (error as { code?: string }).code === "23505" ? "taken" : "failed" };
  }
  revalidateTag(CMS_TAGS.redirects, "max");
  revalidatePath("/admin/content/redirects");
  return { status: "done" };
}

export async function deleteRedirect(id: string): Promise<{ ok: boolean }> {
  const actor = await staffWithRole(ACCESS.redirects);
  if (!actor) return { ok: false };
  const parsed = z.uuid().safeParse(id);
  if (!parsed.success) return { ok: false };
  try {
    await withActor(actor.id, (tx) => tx.delete(redirects).where(eq(redirects.id, parsed.data)));
  } catch {
    return { ok: false };
  }
  revalidateTag(CMS_TAGS.redirects, "max");
  revalidatePath("/admin/content/redirects");
  return { ok: true };
}
