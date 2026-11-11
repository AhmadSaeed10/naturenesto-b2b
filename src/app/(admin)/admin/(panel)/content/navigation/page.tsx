import { MenuEditor } from "@/components/admin/content/MenuEditor";
import { admin } from "@/content/admin";
import { listMenus } from "@/lib/admin/content";
import { ACCESS, requireStaff } from "@/lib/auth/staff";

export default async function NavigationPage() {
  // The layout gates the panel too; checking here keeps this page safe on its own.
  await requireStaff(ACCESS.content);
  const menus = await listMenus();
  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-2xl text-ink-muted">{admin.content.navigation.intro}</p>
      {menus.map((menu) => (
        <MenuEditor
          key={`${menu.id}-${menu.items.map((i) => i.href + i.label).join("|")}`}
          menu={menu}
        />
      ))}
    </div>
  );
}
