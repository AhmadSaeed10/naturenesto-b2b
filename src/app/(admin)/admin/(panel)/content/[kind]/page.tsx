import Link from "next/link";
import { notFound } from "next/navigation";
import { admin } from "@/content/admin";
import { listDocs } from "@/lib/admin/content";
import { isDocKind } from "@/lib/admin/content-kinds";
import { ACCESS, requireStaff } from "@/lib/auth/staff";

const copy = admin.content;
const DATE = new Intl.DateTimeFormat("en-PK", { dateStyle: "medium", timeZone: "Asia/Karachi" });

export default async function DocListPage({ params }: PageProps<"/admin/content/[kind]">) {
  // The layout gates the panel too; checking here keeps this page safe on its own.
  await requireStaff(ACCESS.content);
  const { kind } = await params;
  if (!isDocKind(kind)) notFound();
  const docs = await listDocs(kind);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link
          href={`/admin/content/${kind}/new`}
          className="inline-flex min-h-(--size-tap) items-center rounded-pill bg-primary-dark px-6 font-medium text-background"
        >
          {copy.docs.add[kind]}
        </Link>
      </div>
      {docs.length === 0 ? (
        <p className="text-ink-muted">{copy.docs.empty}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-line rounded-card border border-line bg-background">
          {docs.map((doc) => (
            <li key={doc.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex flex-col">
                <Link
                  href={`/admin/content/${kind}/${doc.id}`}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {doc.title}
                </Link>
                <span className="text-sm text-ink-muted">
                  {doc.handle} · {copy.status[doc.status]}
                  {doc.date ? ` · ${DATE.format(new Date(doc.date))}` : ""}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
