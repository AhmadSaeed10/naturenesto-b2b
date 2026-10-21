import { AdminCard } from "@/components/admin/AdminPage";
import { InviteForm, InviteRow, MemberRow } from "@/components/admin/settings/StaffForms";
import { admin } from "@/content/admin";
import { ACCESS, type StaffRole, requireStaff } from "@/lib/auth/staff";
import { asc, isNotNull, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { ENUMS } from "@/lib/db/enums";
import { profiles, staffInvites } from "@/lib/db/schema";

const copy = admin.settings.staff;

export default async function StaffSettingsPage() {
  const staff = await requireStaff(ACCESS.staff);
  const [members, invites] = await Promise.all([
    db()
      .select({ id: profiles.id, email: profiles.email, role: profiles.role })
      .from(profiles)
      .where(isNotNull(profiles.role))
      .orderBy(asc(profiles.email)),
    db()
      .select({ id: staffInvites.id, email: staffInvites.email, role: staffInvites.role })
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
              editable={mayEdit(invite.role)}
            />
          ))}
        </ul>
      </AdminCard>
    </div>
  );
}
