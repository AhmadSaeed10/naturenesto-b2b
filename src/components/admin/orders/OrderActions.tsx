"use client";

import { useActionState, useId } from "react";
import {
  type OrderActionState,
  addShipment,
  setOrderPayment,
  updateOrderStatus,
} from "@/app/actions/admin-orders";
import { CONTROL } from "@/components/admin/fields";
import { admin } from "@/content/admin";
import type { Enums } from "@/lib/db/enums";
import { cn } from "@/lib/utils";

const copy = admin.orders.actions;
const INITIAL: OrderActionState = { status: "idle" };
const BUTTON =
  "inline-flex min-h-(--size-tap) items-center rounded-pill border border-ink px-5 text-sm disabled:opacity-50";

function Message({ state }: { state: OrderActionState }) {
  const text =
    state.status === "done"
      ? copy.done
      : state.status === "idle"
        ? ""
        : copy.errors[state.status === "forbidden" ? "forbidden" : state.status];
  return (
    <p role="status" aria-live="polite" className="min-h-5 text-sm">
      {text}
    </p>
  );
}

interface OrderActionsProps {
  number: number;
  status: Enums<"order_status">;
  paymentStatus: Enums<"payment_status">;
}

export function OrderActions({ number, status, paymentStatus }: OrderActionsProps) {
  const uid = useId();
  const [statusState, statusAction, statusPending] = useActionState(updateOrderStatus, INITIAL);
  const [payState, payAction, payPending] = useActionState(setOrderPayment, INITIAL);
  const [shipState, shipAction, shipPending] = useActionState(addShipment, INITIAL);
  const closed = status === "delivered" || status === "cancelled";
  const next = (["confirmed", "processing", "shipped", "delivered", "cancelled"] as const).filter(
    (value) => value !== status,
  );

  return (
    <div className="flex flex-col gap-8">
      {!closed ? (
        <form action={statusAction} className="flex flex-col gap-3">
          <input type="hidden" name="number" value={number} />
          <div className="grid gap-3 sm:grid-cols-[12rem_minmax(0,1fr)]">
            <div className="flex flex-col gap-1">
              <label htmlFor={`${uid}-status`} className="text-sm font-medium">
                {copy.status}
              </label>
              <select id={`${uid}-status`} name="status" className={cn(CONTROL, "text-sm")}>
                {next.map((value) => (
                  <option key={value} value={value}>
                    {admin.orders.status[value]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor={`${uid}-note`} className="text-sm font-medium">
                {copy.note}
              </label>
              <input
                id={`${uid}-note`}
                name="note"
                maxLength={300}
                className={cn(CONTROL, "text-sm")}
              />
            </div>
          </div>
          <p className="text-sm text-ink-muted">{copy.cancelHint}</p>
          <div>
            <button type="submit" disabled={statusPending} className={BUTTON}>
              {copy.saveStatus}
            </button>
          </div>
          <Message state={statusState} />
        </form>
      ) : null}

      {status !== "cancelled" ? (
        <form action={payAction} className="flex flex-col gap-2">
          <input type="hidden" name="number" value={number} />
          <input type="hidden" name="paid" value={paymentStatus === "paid" ? "false" : "true"} />
          <div>
            <button type="submit" disabled={payPending} className={BUTTON}>
              {paymentStatus === "paid" ? copy.markUnpaid : copy.markPaid}
            </button>
          </div>
          <Message state={payState} />
        </form>
      ) : null}

      {!closed ? (
        <form action={shipAction} className="flex flex-col gap-3 border-t border-line pt-6">
          <input type="hidden" name="number" value={number} />
          <h3 className="text-h4">{copy.ship}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label htmlFor={`${uid}-carrier`} className="text-sm font-medium">
                {copy.carrier}
              </label>
              <input
                id={`${uid}-carrier`}
                name="carrier"
                maxLength={80}
                className={cn(CONTROL, "text-sm")}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor={`${uid}-tracking`} className="text-sm font-medium">
                {copy.tracking}
              </label>
              <input
                id={`${uid}-tracking`}
                name="trackingNumber"
                maxLength={120}
                className={cn(CONTROL, "text-sm")}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`${uid}-url`} className="text-sm font-medium">
              {copy.trackingUrl}
            </label>
            <input
              id={`${uid}-url`}
              name="trackingUrl"
              type="url"
              maxLength={500}
              className={cn(CONTROL, "text-sm")}
            />
          </div>
          <div>
            <button type="submit" disabled={shipPending} className={BUTTON}>
              {copy.saveShipment}
            </button>
          </div>
          <Message state={shipState} />
        </form>
      ) : null}
    </div>
  );
}
