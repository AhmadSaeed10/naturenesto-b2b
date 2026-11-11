import { signOut } from "@/app/actions/admin-auth";
import { admin } from "@/content/admin";
import { type StaffMember, canAccess } from "@/lib/auth/staff";
import { AdminSidebar } from "./AdminSidebar";

const MAIN_ID = "admin-main";

interface AdminShellProps {
  staff: StaffMember;
  children: React.ReactNode;
}

function allowedSections(staff: StaffMember): string[] {
  const keys = ["home", "settings"];
  if (canAccess(staff, "media")) keys.push("media");
  if (canAccess(staff, "catalog")) keys.push("products", "collections", "inventory");
  if (canAccess(staff, "content")) keys.push("content");
  if (canAccess(staff, "orders")) keys.push("orders");
  if (canAccess(staff, "customers")) keys.push("customers");
  if (canAccess(staff, "reviews")) keys.push("reviews");
  return keys;
}

// Shopify style frame: sidebar on the left, content on a calm surface. No storefront
// texture or motion here; the admin is a tool.
export function AdminShell({ staff, children }: AdminShellProps) {
  return (
    <div className="flex flex-1 flex-col lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <a
        href={`#${MAIN_ID}`}
        className="sr-only z-50 rounded-xl bg-background px-4 py-3 text-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {admin.shell.skip}
      </a>
      <AdminSidebar
        allowed={allowedSections(staff)}
        roleLabel={admin.roles[staff.role]}
        showSearch={canAccess(staff, "catalog")}
        email={staff.email}
        signOut={signOut}
      />
      <main id={MAIN_ID} tabIndex={-1} className="min-w-0 focus:outline-none">
        {children}
      </main>
    </div>
  );
}
