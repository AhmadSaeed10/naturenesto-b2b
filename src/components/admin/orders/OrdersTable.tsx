import Link from "next/link";
import { admin } from "@/content/admin";
import type { OrderRow } from "@/lib/admin/orders";
import { formatPaisa } from "@/lib/money";
import { PaymentPill, StatusPill } from "./OrderBadges";

const DATE = new Intl.DateTimeFormat("en-PK", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Karachi",
});

export const formatOrderDate = (iso: string): string => DATE.format(new Date(iso));

export function OrdersTable({ rows }: { rows: OrderRow[] }) {
  const copy = admin.orders;
  return (
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
          {rows.map((row) => (
            <tr key={row.number} className="border-b border-line last:border-b-0">
              <td className="p-3">
                <Link
                  href={`/admin/orders/${row.number}`}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  #{row.number}
                </Link>
              </td>
              <td className="p-3 text-ink-muted">{formatOrderDate(row.placedAt)}</td>
              <td className="p-3">
                {row.fullName}
                <span className="block text-ink-muted">{row.phone}</span>
              </td>
              <td className="p-3">
                <PaymentPill status={row.paymentStatus} />
              </td>
              <td className="p-3">
                <StatusPill status={row.status} />
              </td>
              <td className="p-3 font-medium">{formatPaisa(row.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
