import { admin } from "@/content/admin";
import type { Enums } from "@/lib/db/enums";
import { cn } from "@/lib/utils";

const PILL = "inline-flex rounded-pill border px-2.5 py-0.5 text-xs font-medium";

export function StatusPill({ status }: { status: Enums<"order_status"> }) {
  const open = status === "pending";
  return (
    <span
      className={cn(
        PILL,
        open
          ? "border-ink bg-ink text-background"
          : status === "cancelled"
            ? "border-line text-ink-muted"
            : "border-primary-dark text-primary-dark",
      )}
    >
      {admin.orders.status[status]}
    </span>
  );
}

export function PaymentPill({ status }: { status: Enums<"payment_status"> }) {
  return (
    <span
      className={cn(
        PILL,
        status === "paid" ? "border-primary-dark text-primary-dark" : "border-line text-ink-muted",
      )}
    >
      {admin.orders.payment[status]}
    </span>
  );
}
