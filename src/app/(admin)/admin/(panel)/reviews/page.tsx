import Link from "next/link";
import { moderateReview } from "@/app/actions/admin-reviews";
import { AdminPage } from "@/components/admin/AdminPage";
import { AdminPager, pageParam } from "@/components/admin/AdminPager";
import { formatOrderDate } from "@/components/admin/orders/OrdersTable";
import { admin } from "@/content/admin";
import { listReviews } from "@/lib/admin/reviews";
import { ACCESS, requireStaff } from "@/lib/auth/staff";

const copy = admin.reviews;
const BUTTON =
  "inline-flex min-h-(--size-tap) items-center rounded-pill border border-ink px-4 text-sm hover:bg-surface";

export default async function ReviewsPage({ searchParams }: PageProps<"/admin/reviews">) {
  await requireStaff(ACCESS.reviews);
  const data = await listReviews(pageParam((await searchParams).page));

  return (
    <AdminPage title={copy.title} intro={copy.intro}>
      {data.rows.length === 0 ? (
        <p className="text-ink-muted">{copy.empty}</p>
      ) : (
        <div className="overflow-x-auto rounded-card border border-line bg-background">
          <table className="w-full min-w-[56rem] text-left text-sm">
            <thead className="border-b border-line text-ink-muted">
              <tr>
                {Object.entries(copy.columns).map(([key, label]) => (
                  <th key={key} scope="col" className="p-3 font-medium">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={row.id} className="border-b border-line align-top last:border-b-0">
                  <td className="p-3">
                    <Link
                      href={`/products/${row.handle}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {row.handle}
                    </Link>
                  </td>
                  <td className="p-3 whitespace-nowrap">{row.rating} / 5</td>
                  <td className="max-w-md p-3">
                    {row.title ? <p className="font-medium">{row.title}</p> : null}
                    <p className="whitespace-pre-line">{row.body}</p>
                    <p className="mt-1 text-ink-muted">
                      {row.author} · {copy.status[row.status === "hidden" ? "hidden" : "published"]}
                    </p>
                  </td>
                  <td className="p-3 whitespace-nowrap text-ink-muted">
                    {formatOrderDate(row.createdAt.toISOString())}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <form action={moderateReview}>
                        <input type="hidden" name="id" value={row.id} />
                        <input
                          type="hidden"
                          name="op"
                          value={row.status === "hidden" ? "show" : "hide"}
                        />
                        <button type="submit" className={BUTTON}>
                          {row.status === "hidden" ? copy.show : copy.hide}
                        </button>
                      </form>
                      <form action={moderateReview}>
                        <input type="hidden" name="id" value={row.id} />
                        <input type="hidden" name="op" value="delete" />
                        <button type="submit" className={BUTTON}>
                          {copy.remove}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <AdminPager
        page={data.page}
        pageCount={data.pageCount}
        href={(page) => `/admin/reviews?page=${page}`}
      />
    </AdminPage>
  );
}
