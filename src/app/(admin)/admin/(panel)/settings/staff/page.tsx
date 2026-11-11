import { AdminCard } from "@/components/admin/AdminPage";
import { InviteForm, InviteRow, MemberRow } from "@/components/admin/settings/StaffForms";
import { admin } from "@/content/admin";
import { ACCESS, type StaffRole, requireStaff } from "@/lib/auth/staff";
import { asc, isNotNull, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { ENUMS } from "@/lib/db/enums";
import { profiles, staffInvites } from "@/lib/db/schema";

const copy = admin.settings.staff;

/** Whole hours until a link stops working; null when the invite has no link. */
function hoursUntil(date: Date | null): number | null {
  return date ? Math.max(0, Math.ceil((date.getTime() - Date.now()) / 3_600_000)) : null;
}

export default async function StaffSettingsPage() {
  const staff = await requireStaff(ACCESS.staff);
  const [members, invites] = await Promise.all([
    db()
      .select({
        id: profiles.id,
        email: profiles.email,
        role: profiles.role,
        permissions: profiles.permissions,
      })
      .from(profiles)
      .where(isNotNull(profiles.role))
      .orderBy(asc(profiles.email)),
    db()
      .select({
        id: staffInvites.id,
        email: staffInvites.email,
        role: staffInvites.role,
        permissions: staffInvites.permissions,
        expiresAt: staffInvites.expiresAt,
      })
      .from(staffInvites)
      .where(isNull(staffInvites.acceptedAt))
      .orderBy(asc(staffInvites.email)),
  ]);

  // Admins cannot grant or touch the owner role; owners can do everything.
  const assignable: readonly StaffRole[] =
    staff.role === "owner" ? ENUMS.staff_role : ENUMS.staff_role.filter((role) => role !== "owner");
  const mayEdit = (role: StaffRole): boolean => staff.role === "owner" || role !== "owner";

  return (
    <div className="flex flex-col gap-6">
      <AdminCard title={copy.invite.title} description={copy.intro}>
        <InviteForm roles={assignable} />
      </AdminCard>
      <AdminCard title={copy.title}>
        <ul>
          {members.flatMap((member) =>
            member.role
              ? [
                  <MemberRow
                    key={member.id}
                    id={member.id}
                    email={member.email}
                    role={member.role}
                    isSelf={member.id === staff.id}
                    editable={mayEdit(member.role)}
                    roles={assignable}
                    areas={member.permissions}
                  />,
                ]
              : [],
          )}
          {invites.map((invite) => (
            <InviteRow
              key={invite.id}
              id={invite.id}
              email={invite.email}
              role={invite.role}
              areas={invite.permissions}
              hoursLeft={hoursUntil(invite.expiresAt)}
              editable={mayEdit(invite.role)}
            />
          ))}
        </ul>
      </AdminCard>
    </div>
  );
}
