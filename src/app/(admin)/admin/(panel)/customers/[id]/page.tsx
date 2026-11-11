import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { AdminCard, AdminPage } from "@/components/admin/AdminPage";
import { OrdersTable } from "@/components/admin/orders/OrdersTable";
import { admin } from "@/content/admin";
import { getCustomer } from "@/lib/admin/orders";
import { ACCESS, requireStaff } from "@/lib/auth/staff";

const copy = admin.customers;

export default async function CustomerPage({ params }: PageProps<"/admin/customers/[id]">) {
  await requireStaff(ACCESS.customers);
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) notFound();
  const data = await getCustomer(id.data);
  if (!data) notFound();
  const { customer } = data;

  return (
    <AdminPage
      title={customer.fullName || customer.email}
      actions={
        <Link
          href="/admin/customers"
          className="text-sm text-primary-dark underline underline-offset-4"
        >
          {copy.detail.back}
        </Link>
      }
    >
      <AdminCard>
        <p className="flex flex-col text-sm">
          <a
            href={`mailto:${customer.email}`}
            className="break-all underline-offset-4 hover:underline"
          >
            {customer.email}
          </a>
          {customer.phone ? (
            <a href={`tel:${customer.phone}`} className="underline-offset-4 hover:underline">
              {customer.phone}
            </a>
          ) : null}
        </p>
      </AdminCard>
      <AdminCard title={copy.detail.orders}>
        {data.orders.length === 0 ? (
          <p className="text-sm text-ink-muted">{copy.detail.noOrders}</p>
        ) : (
          <OrdersTable rows={data.orders} />
        )}
      </AdminCard>
    </AdminPage>
  );
}
