import Link from "next/link";
import { admin } from "@/content/admin";
import { listHomeSections } from "@/lib/admin/content";
import { ACCESS, requireStaff } from "@/lib/auth/staff";

const copy = admin.content;

export default async function ContentHomePage() {
  // The layout gates the panel too; checking here keeps this page safe on its own.
  await requireStaff(ACCESS.content);
  const sections = await listHomeSections();
  return (
    <div className="flex flex-col gap-4">
      <p className="max-w-2xl text-ink-muted">{copy.home.intro}</p>
      <ol className="flex flex-col divide-y divide-line rounded-card border border-line bg-background">
        {sections.map((section, index) => (
          <li key={section.type} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-4">
              <span className="font-serif text-h4 text-ink-muted">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="flex flex-col">
                <Link
                  href={`/admin/content/home/${section.type}`}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {copy.home.sections[section.type]}
                </Link>
                <span className="text-sm text-ink-muted">
                  {section.visible ? copy.status.published : copy.status.hidden}
                  {section.hasDraft ? ` · ${copy.status.changes}` : ""}
                </span>
              </div>
            </div>
            <Link
              href={`/admin/content/home/${section.type}`}
              className="inline-flex min-h-(--size-tap) items-center rounded-pill border border-ink px-5 text-sm"
            >
              {copy.home.edit}
              <span className="sr-only">: {copy.home.sections[section.type]}</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
