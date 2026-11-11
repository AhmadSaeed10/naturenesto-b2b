import Link from "next/link";
import { AdminPage } from "@/components/admin/AdminPage";
import { AdminPager, pageParam, param, withParams } from "@/components/admin/AdminPager";
import { formatOrderDate } from "@/components/admin/orders/OrdersTable";
import { admin } from "@/content/admin";
import { cleanSearch } from "@/lib/admin/media";
import { listCustomers } from "@/lib/admin/orders";
import { ACCESS, requireStaff } from "@/lib/auth/staff";
import { formatPaisa } from "@/lib/money";

const copy = admin.customers;

export default async function CustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  await requireStaff(ACCESS.customers);
  const params = await searchParams;
  const query = cleanSearch(param(params.q));
  const data = await listCustomers({ query, page: pageParam(params.page) });

  return (
    <AdminPage title={copy.title} intro={copy.intro}>
      <form role="search" className="flex max-w-sm gap-2">
        <label htmlFor="customers-q" className="sr-only">
          {copy.search}
        </label>
        <input
          id="customers-q"
          name="q"
          type="search"
          defaultValue={query}
          placeholder={copy.search}
          className="min-h-(--size-tap) min-w-0 flex-1 rounded-pill border border-ink-muted bg-background px-4 text-sm"
        />
        <button
          type="submit"
          className="inline-flex min-h-(--size-tap) items-center rounded-pill border border-ink px-5 text-sm"
        >
          {admin.shell.searchSubmit}
        </button>
      </form>
      {data.rows.length === 0 ? (
        <p className="text-ink-muted">{copy.empty}</p>
      ) : (
        <div className="overflow-x-auto rounded-card border border-line bg-background">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <thead className="border-b border-line text-ink-muted">
              <tr>
                {Object.values(copy.columns).map((label) => (
                  <th key={label} scope="col" className="p-3 font-medium">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={row.id} className="border-b border-line last:border-b-0">
                  <td className="p-3">
                    <Link
                      href={`/admin/customers/${row.id}`}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      {row.fullName || row.email}
                    </Link>
                  </td>
                  <td className="p-3 break-all text-ink-muted">{row.email}</td>
                  <td className="p-3 text-ink-muted">{row.phone}</td>
                  <td className="p-3">{row.orderCount}</td>
                  <td className="p-3 font-medium">{formatPaisa(row.spent)}</td>
                  <td className="p-3 text-ink-muted">
                    {row.lastOrderAt ? formatOrderDate(row.lastOrderAt) : ""}
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
        href={(n) => withParams("/admin/customers", { q: query, page: n })}
      />
    </AdminPage>
  );
}
