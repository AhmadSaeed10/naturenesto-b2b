import "server-only";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { ADMIN_HOME, ADMIN_LOGIN } from "./paths";
import { getSessionUser } from "./session";

export type StaffRole = NonNullable<typeof profiles.$inferSelect.role>;

export interface StaffMember {
  id: string;
  email: string;
  fullName: string | null;
  role: StaffRole;
}

/** The staff profile for a user id, or null when the user has no staff role. */
export async function loadStaff(userId: string): Promise<StaffMember | null> {
  const [profile] = await db()
    .select({
      id: profiles.id,
      email: profiles.email,
      fullName: profiles.fullName,
      role: profiles.role,
    })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);
  if (!profile?.role) return null;
  return { id: profile.id, email: profile.email, fullName: profile.fullName, role: profile.role };
}

/** The signed-in staff member, deduplicated per request. Customers have no role, so they are not staff. */
export const getStaff = cache(async (): Promise<StaffMember | null> => {
  const user = await getSessionUser();
  return user ? loadStaff(user.id) : null;
});

/**
 * Server-side role gate for admin layouts, pages and actions. The database has no row level
 * security any more, so every admin read and write must start here.
 */
export async function requireStaff(roles?: readonly StaffRole[]): Promise<StaffMember> {
  const staff = await getStaff();
  if (!staff) redirect(`${ADMIN_LOGIN}?error=not-staff`);
  // Staff without access to this area go back to the admin home rather than to login.
  if (roles && !roles.includes(staff.role)) redirect(ADMIN_HOME);
  return staff;
}

/** For server actions: the caller if they hold one of the roles, otherwise null. */
export async function staffWithRole(roles: readonly StaffRole[]): Promise<StaffMember | null> {
  const staff = await getStaff();
  return staff && roles.includes(staff.role) ? staff : null;
}

/** Who may use each admin area. Enforced in server code, not by the database. */
export const ACCESS = {
  media: ["owner", "admin", "editor"],
  catalog: ["owner", "admin", "editor"],
  content: ["owner", "admin", "editor"],
  redirects: ["owner", "admin"],
  storeSettings: ["owner", "admin"],
  staff: ["owner", "admin"],
} as const satisfies Record<string, readonly StaffRole[]>;

export const canAccess = (role: StaffRole, area: keyof typeof ACCESS): boolean =>
  (ACCESS[area] as readonly StaffRole[]).includes(role);
