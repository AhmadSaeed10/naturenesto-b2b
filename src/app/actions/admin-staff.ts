"use server";

import { and, count, eq, isNotNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ACCESS, type StaffRole, staffWithRole } from "@/lib/auth/staff";
import { withActor } from "@/lib/db";
import { profiles, staffInvites, staffRole } from "@/lib/db/schema";

export interface StaffActionState {
  status: "idle" | "done" | "invalid" | "exists" | "forbidden" | "last_owner" | "failed";
}

const STAFF_PATH = "/admin/settings/staff";
const role = z.enum(staffRole.enumValues);

/** Admins manage everyone except owners; only owners grant or change the owner role. */
const mayAssign = (actor: StaffRole, target: StaffRole): boolean =>
  actor === "owner" || target !== "owner";

async function ownerCount(tx: Parameters<Parameters<typeof withActor>[1]>[0]): Promise<number> {
  const [row] = await tx.select({ n: count() }).from(profiles).where(eq(profiles.role, "owner"));
  return row?.n ?? 0;
}

export async function inviteStaff(
  _previous: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const actor = await staffWithRole(ACCESS.staff);
  if (!actor) return { status: "forbidden" };
  const parsed = z
    .object({
      email: z
        .email()
        .max(320)
        .transform((v) => v.trim().toLowerCase()),
      role,
    })
    .safeParse({ email: formData.get("email"), role: formData.get("role") });
  if (!parsed.success) return { status: "invalid" };
  if (!mayAssign(actor.role, parsed.data.role)) return { status: "forbidden" };

  try {
    return await withActor(actor.id, async (tx) => {
      const [existing] = await tx
        .select({ id: profiles.id })
        .from(profiles)
        .where(and(sql`lower(${profiles.email}) = ${parsed.data.email}`, isNotNull(profiles.role)))
        .limit(1);
      if (existing) return { status: "exists" as const };
      await tx.insert(staffInvites).values(parsed.data);
      return { status: "done" as const };
    }).then((state) => {
      if (state.status === "done") revalidatePath(STAFF_PATH);
      return state;
    });
  } catch (error) {
    return { status: (error as { code?: string }).code === "23505" ? "exists" : "failed" };
  }
}

const memberSchema = z.object({
  id: z.uuid(),
  // Empty means "remove access".
  role: z.union([z.literal(""), role]),
});

export async function updateStaffRole(
  _previous: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const actor = await staffWithRole(ACCESS.staff);
  if (!actor) return { status: "forbidden" };
  const parsed = memberSchema.safeParse({
    id: formData.get("id"),
    role: formData.get("role") ?? "",
  });
  if (!parsed.success) return { status: "invalid" };
  const nextRole = parsed.data.role || null;

  try {
    const state = await withActor(actor.id, async (tx): Promise<StaffActionState> => {
      const [member] = await tx
        .select({ id: profiles.id, email: profiles.email, role: profiles.role })
        .from(profiles)
        .where(eq(profiles.id, parsed.data.id))
        .limit(1);
      if (!member?.role) return { status: "invalid" };
      if (!mayAssign(actor.role, member.role) || (nextRole && !mayAssign(actor.role, nextRole))) {
        return { status: "forbidden" };
      }
      if (member.role === "owner" && nextRole !== "owner" && (await ownerCount(tx)) <= 1) {
        return { status: "last_owner" };
      }
      // The guard_profile_role trigger re-checks these rules in the database.
      await tx.update(profiles).set({ role: nextRole }).where(eq(profiles.id, member.id));
      if (!nextRole) {
        // Clear the invite too, so signing in again cannot restore the old role.
        await tx
          .delete(staffInvites)
          .where(sql`lower(${staffInvites.email}) = ${member.email.toLowerCase()}`);
      }
      return { status: "done" };
    });
    if (state.status === "done") revalidatePath(STAFF_PATH);
    return state;
  } catch (error) {
    return { status: (error as { code?: string }).code === "42501" ? "forbidden" : "failed" };
  }
}

export async function revokeInvite(
  _previous: StaffActionState,
  formData: FormData,
): Promise<StaffActionState> {
  const actor = await staffWithRole(ACCESS.staff);
  if (!actor) return { status: "forbidden" };
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return { status: "invalid" };

  try {
    const state = await withActor(actor.id, async (tx): Promise<StaffActionState> => {
      const [invite] = await tx
        .select({
          id: staffInvites.id,
          role: staffInvites.role,
          acceptedAt: staffInvites.acceptedAt,
        })
        .from(staffInvites)
        .where(eq(staffInvites.id, id.data))
        .limit(1);
      if (!invite || invite.acceptedAt) return { status: "invalid" };
      if (!mayAssign(actor.role, invite.role)) return { status: "forbidden" };
      await tx.delete(staffInvites).where(eq(staffInvites.id, invite.id));
      return { status: "done" };
    });
    if (state.status === "done") revalidatePath(STAFF_PATH);
    return state;
  } catch {
    return { status: "failed" };
  }
}
