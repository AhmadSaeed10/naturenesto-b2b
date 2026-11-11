import { AdminPage } from "@/components/admin/AdminPage";
import { ContentTabs } from "@/components/admin/content/ContentTabs";
import { admin } from "@/content/admin";
import { ACCESS, canAccess, requireStaff } from "@/lib/auth/staff";

export default async function ContentLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff(ACCESS.content);
  return (
    <AdminPage title={admin.content.title}>
      <ContentTabs showRedirects={canAccess(staff, "redirects")} />
      {children}
    </AdminPage>
  );
}
