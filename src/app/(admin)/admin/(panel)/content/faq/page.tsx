import { FaqManager } from "@/components/admin/content/FaqManager";
import { listFaqForEditor } from "@/lib/admin/content";
import { ACCESS, requireStaff } from "@/lib/auth/staff";

export default async function FaqAdminPage() {
  // The layout gates the panel too; checking here keeps this page safe on its own.
  await requireStaff(ACCESS.content);
  const items = await listFaqForEditor();
  return (
    <FaqManager key={items.map((item) => `${item.id}:${item.position}`).join("|")} items={items} />
  );
}
