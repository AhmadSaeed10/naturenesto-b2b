import { AdminPage } from "@/components/admin/AdminPage";
import { SettingsTabs } from "@/components/admin/settings/SettingsTabs";
import { admin } from "@/content/admin";
import { canAccess, requireStaff } from "@/lib/auth/staff";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff();
  const allowed = [
    ...(canAccess(staff, "storeSettings") ? (["store", "commerce"] as const) : []),
    ...(canAccess(staff, "staff") ? (["staff"] as const) : []),
    "account" as const,
  ];
  return (
    <AdminPage title={admin.settings.title}>
      <SettingsTabs allowed={allowed} />
      {children}
    </AdminPage>
  );
}
