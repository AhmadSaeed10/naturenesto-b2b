import { notFound } from "next/navigation";
import { SectionEditor } from "@/components/admin/content/SectionEditor";
import { getSectionForEditor } from "@/lib/admin/content";
import { getEditorOptions } from "@/lib/admin/products";
import { ACCESS, requireStaff } from "@/lib/auth/staff";

export default async function SectionEditPage({ params }: PageProps<"/admin/content/home/[type]">) {
  // The layout gates the panel too; checking here keeps this page safe on its own.
  await requireStaff(ACCESS.content);
  const { type } = await params;
  const [section, options] = await Promise.all([getSectionForEditor(type), getEditorOptions()]);
  if (!section) notFound();
  return (
    <SectionEditor
      key={`${section.type}-${section.hasDraft}-${section.visible}`}
      type={section.type}
      initial={section.value as Record<string, unknown>}
      hasDraft={section.hasDraft}
      visible={section.visible}
      media={options.media}
    />
  );
}
