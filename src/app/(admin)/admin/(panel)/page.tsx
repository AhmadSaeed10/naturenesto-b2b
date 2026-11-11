import Link from "next/link";
import { AdminCard, AdminPage } from "@/components/admin/AdminPage";
import { OrdersTable } from "@/components/admin/orders/OrdersTable";
import { admin } from "@/content/admin";
import { dashboardData } from "@/lib/admin/orders";
import { canAccess, requireStaff } from "@/lib/auth/staff";
import { formatPaisa } from "@/lib/money";

const LINK = "text-sm text-primary-dark underline underline-offset-4";

export default async function AdminHomePage() {
  const staff = await requireStaff();
  const copy = admin.dashboard;
  const data = canAccess(staff, "orders") ? await dashboardData() : null;

  const stats = data
    ? [
        { label: `${copy.today}: ${copy.orders}`, value: String(data.today.orders) },
        { label: `${copy.today}: ${copy.revenue}`, value: formatPaisa(data.today.revenue) },
        { label: `${copy.week}: ${copy.orders}`, value: String(data.week.orders) },
        { label: `${copy.week}: ${copy.revenue}`, value: formatPaisa(data.week.revenue) },
      ]
    : [];

  return (
    <AdminPage title={copy.title} intro={staff.email}>
      {data ? (
        <>
          <AdminCard>
            <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl bg-surface p-4">
                  <dt className="text-sm text-ink-muted">{stat.label}</dt>
                  <dd className="font-serif text-h3">{stat.value}</dd>
                </div>
              ))}
            </dl>
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="font-medium">
                {copy.pending}: {data.toAction}
              </span>
              <Link href="/admin/orders?filter=pending" className={LINK}>
                {copy.viewOrders}
              </Link>
            </p>
          </AdminCard>

          <AdminCard title={copy.recent}>
            {data.recent.length === 0 ? (
              <p className="text-sm text-ink-muted">{copy.noRecent}</p>
            ) : (
              <OrdersTable rows={data.recent} />
            )}
          </AdminCard>

          {canAccess(staff, "catalog") ? (
            <AdminCard title={copy.lowStock}>
              {data.lowStock.length === 0 ? (
                <p className="text-sm text-ink-muted">{copy.allGood}</p>
              ) : (
                <ul className="flex flex-col divide-y divide-line text-sm">
                  {data.lowStock.map((row) => (
                    <li
                      key={`${row.productId}-${row.variant}`}
                      className="flex justify-between gap-4 py-2"
                    >
                      <Link
                        href={`/admin/products/${row.productId}`}
                        className="underline-offset-4 hover:underline"
                      >
                        {row.title}
                        {row.variant !== "Default" ? ` · ${row.variant}` : ""}
                      </Link>
                      <span className="font-medium">{row.stock}</span>
                    </li>
                  ))}
                </ul>
              )}
              <Link href="/admin/inventory?filter=low" className={LINK}>
                {copy.viewInventory}
              </Link>
            </AdminCard>
          ) : null}
        </>
      ) : (
        <AdminCard>
          <p className="max-w-prose text-ink-muted">{admin.home.next}</p>
        </AdminCard>
      )}
    </AdminPage>
  );
}
