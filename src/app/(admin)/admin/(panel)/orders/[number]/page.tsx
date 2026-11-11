import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminCard, AdminPage } from "@/components/admin/AdminPage";
import { OrderActions } from "@/components/admin/orders/OrderActions";
import { PaymentPill, StatusPill } from "@/components/admin/orders/OrderBadges";
import { formatOrderDate } from "@/components/admin/orders/OrdersTable";
import { admin } from "@/content/admin";
import { customerIdForOrder } from "@/lib/admin/orders";
import { ACCESS, requireStaff } from "@/lib/auth/staff";
import { getOrder } from "@/lib/commerce/orders";
import { formatPaisa } from "@/lib/money";

const copy = admin.orders;

export default async function OrderDetailPage({ params }: PageProps<"/admin/orders/[number]">) {
  await requireStaff(ACCESS.orders);
  const number = Number((await params).number);
  if (!Number.isInteger(number)) notFound();
  const order = await getOrder(number, null);
  if (!order) notFound();
  const customerId = await customerIdForOrder(number);
  const d = copy.detail;
  const address = [
    order.address.line1,
    order.address.line2,
    order.address.area,
    [order.address.city, order.address.postal_code].filter(Boolean).join(" "),
    order.address.province,
  ].filter(Boolean);
  const totals: [string, number, boolean?][] = [
    [d.totals.subtotal, order.subtotal],
    ...(order.discountTotal ? [[d.totals.discount, -order.discountTotal] as [string, number]] : []),
    [d.totals.shipping, order.shippingTotal],
    ...(order.taxTotal ? [[d.totals.tax, order.taxTotal] as [string, number]] : []),
    [d.totals.total, order.total, true],
  ];

  return (
    <AdminPage
      title={d.title(order.number)}
      intro={formatOrderDate(order.placedAt)}
      actions={
        <Link
          href="/admin/orders"
          className="text-sm text-primary-dark underline underline-offset-4"
        >
          {d.back}
        </Link>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill status={order.status} />
        <PaymentPill status={order.paymentStatus} />
        <span className="text-sm text-ink-muted">
          {copy.methods[order.paymentMethod as keyof typeof copy.methods] ?? order.paymentMethod}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex flex-col gap-6">
          <AdminCard title={d.items}>
            <ul className="flex flex-col divide-y divide-line">
              {order.items.map((item) => (
                <li
                  key={`${item.title}-${item.variantTitle}`}
                  className="flex justify-between gap-4 py-3 text-sm"
                >
                  <span>
                    <span className="font-medium">{item.title}</span>
                    {item.variantTitle ? (
                      <span className="block text-ink-muted">{item.variantTitle}</span>
                    ) : null}
                    <span className="block text-ink-muted">
                      {d.qty} {item.quantity} x {formatPaisa(item.unitPrice)}
                    </span>
                  </span>
                  <span className="font-medium">{formatPaisa(item.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <dl className="flex flex-col gap-1 border-t border-line pt-4 text-sm">
              {totals.map(([label, value, strong]) => (
                <div key={label} className="flex justify-between">
                  <dt className={strong ? "font-medium" : "text-ink-muted"}>{label}</dt>
                  <dd className={strong ? "font-serif text-h4" : ""}>{formatPaisa(value)}</dd>
                </div>
              ))}
            </dl>
          </AdminCard>

          <AdminCard title={copy.actions.title}>
            <OrderActions
              number={order.number}
              status={order.status}
              paymentStatus={order.paymentStatus}
            />
          </AdminCard>

          <AdminCard title={d.history}>
            <ol className="flex flex-col gap-2 text-sm">
              {order.history.map((h) => (
                <li key={h.at + h.status} className="flex flex-wrap justify-between gap-x-4">
                  <span>
                    <span className="font-medium">
                      {copy.status[h.status as keyof typeof copy.status] ?? h.status}
                    </span>
                    {h.note ? <span className="text-ink-muted"> · {h.note}</span> : null}
                  </span>
                  <time dateTime={h.at} className="text-ink-muted">
                    {formatOrderDate(h.at)}
                  </time>
                </li>
              ))}
            </ol>
          </AdminCard>
        </div>

        <div className="flex flex-col gap-6">
          <AdminCard title={d.customer}>
            <p className="flex flex-col text-sm">
              <span className="font-medium">{order.fullName}</span>
              <a
                href={`mailto:${order.email}`}
                className="break-all underline-offset-4 hover:underline"
              >
                {order.email}
              </a>
              <a href={`tel:${order.phone}`} className="underline-offset-4 hover:underline">
                {order.phone}
              </a>
            </p>
            {customerId ? (
              <Link
                href={`/admin/customers/${customerId}`}
                className="text-sm text-primary-dark underline underline-offset-4"
              >
                {d.viewCustomer}
              </Link>
            ) : null}
          </AdminCard>
          <AdminCard title={d.shipTo}>
            <address className="text-sm not-italic">
              {address.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
          </AdminCard>
          {order.notes ? (
            <AdminCard title={d.notes}>
              <p className="text-sm whitespace-pre-line">{order.notes}</p>
            </AdminCard>
          ) : null}
          <AdminCard title={d.shipments}>
            {order.fulfillments.length === 0 ? (
              <p className="text-sm text-ink-muted">{d.noShipments}</p>
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {order.fulfillments.map((f) => (
                  <li key={`${f.trackingNumber}-${f.shippedAt}`}>
                    <span className="font-medium">{f.carrier}</span> {f.trackingNumber}
                    {f.trackingUrl ? (
                      <>
                        {" "}
                        <a
                          href={f.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-dark underline underline-offset-4"
                        >
                          {d.track}
                        </a>
                      </>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>
        </div>
      </div>
    </AdminPage>
  );
}
