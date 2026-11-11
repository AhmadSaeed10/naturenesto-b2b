import Link from "next/link";
import { AdminPage } from "@/components/admin/AdminPage";
import { AdminPager, pageParam, param, withParams } from "@/components/admin/AdminPager";
import { OrdersTable } from "@/components/admin/orders/OrdersTable";
import { admin } from "@/content/admin";
import { cleanSearch } from "@/lib/admin/media";
import { type OrderFilter, listOrders } from "@/lib/admin/orders";
import { ACCESS, requireStaff } from "@/lib/auth/staff";
import { ENUMS } from "@/lib/db/enums";
import { cn } from "@/lib/utils";

const copy = admin.orders;
const FILTERS: OrderFilter[] = ["all", ...ENUMS.order_status];
const isFilter = (value: string): value is OrderFilter => (FILTERS as string[]).includes(value);

export default async function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  await requireStaff(ACCESS.orders);
  const params = await searchParams;
  const query = cleanSearch(param(params.q));
  const filterParam = param(params.filter);
  const filter: OrderFilter = isFilter(filterParam) ? filterParam : "all";
  const data = await listOrders({ query, filter, page: pageParam(params.page) });
  const href = (next: Partial<{ filter: OrderFilter; page: number }>) =>
    withParams("/admin/orders", {
      q: query,
      filter: (next.filter ?? filter) === "all" ? "" : (next.filter ?? filter),
      page: next.page ?? 1,
    });

  return (
    <AdminPage title={copy.title} intro={copy.intro}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <nav aria-label={copy.title}>
          <ul className="flex flex-wrap gap-2">
            {FILTERS.map((key) => (
              <li key={key}>
                <Link
                  href={href({ filter: key, page: 1 })}
                  aria-current={filter === key ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-(--size-tap) items-center rounded-pill border px-5 text-sm",
                    filter === key
                      ? "border-primary-dark bg-primary-dark text-background"
                      : "border-line bg-background",
                  )}
                >
                  {copy.filters[key]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <form role="search" className="flex min-w-0 flex-1 gap-2 md:max-w-sm">
          {filter !== "all" ? <input type="hidden" name="filter" value={filter} /> : null}
          <label htmlFor="orders-q" className="sr-only">
            {copy.search}
          </label>
          <input
            id="orders-q"
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
      </div>
      {data.rows.length === 0 ? (
        <p className="text-ink-muted">{copy.empty}</p>
      ) : (
        <OrdersTable rows={data.rows} />
      )}
      <AdminPager page={data.page} pageCount={data.pageCount} href={(n) => href({ page: n })} />
    </AdminPage>
  );
}
