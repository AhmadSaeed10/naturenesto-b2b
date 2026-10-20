"use client";

import Image from "next/image";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { placeOrder, type OrderField, type OrderState } from "@/app/actions/order";
import { FloatingField } from "@/components/forms/FloatingField";
import { Button } from "@/components/ui/Button";
import { commerce } from "@/content/commerce";
import type { CartProduct } from "@/lib/catalog";
import { clearCart, useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import {
  DELIVERY_ZONES,
  isDeliveryZone,
  priceOrder,
  type DeliveryRates,
  type DeliveryZone,
  type PricedOrder,
} from "@/lib/order";
import { cn } from "@/lib/utils";

const copy = commerce.checkout;
const INITIAL: OrderState = { status: "idle" };

interface CheckoutFormProps {
  catalog: Record<string, CartProduct>;
  rates: DeliveryRates;
  browseHref: string;
}

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex justify-between gap-4",
        strong && "border-t border-line pt-3 text-lead font-medium",
      )}
    >
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function OrderLines({ order }: { order: PricedOrder }) {
  return (
    <ul className="flex flex-col gap-4">
      {order.lines.map((line) => (
        <li
          key={line.handle}
          className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-3 text-small"
        >
          <div className="relative aspect-square overflow-hidden rounded-xl bg-surface">
            <Image src={line.image} alt="" fill sizes="56px" className="object-cover" />
          </div>
          <span>
            {line.name}
            {line.size ? ` · ${line.size}` : ""} × {line.quantity}
          </span>
          <span>{formatPrice(line.lineTotal)}</span>
        </li>
      ))}
    </ul>
  );
}

function Totals({ order }: { order: PricedOrder }) {
  return (
    <dl className="flex flex-col gap-2 text-small">
      <SummaryRow label={copy.subtotal} value={formatPrice(order.subtotal)} />
      {order.delivery !== null ? (
        <SummaryRow
          label={copy.shipping}
          value={order.delivery === 0 ? copy.free : formatPrice(order.delivery)}
        />
      ) : null}
      <SummaryRow label={copy.total} value={formatPrice(order.total)} strong />
    </dl>
  );
}

function Confirmation({ state }: { state: Extract<OrderState, { status: "placed" }> }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);
  const o = commerce.order;
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="flex flex-col items-start gap-5">
        <p className="eyebrow text-ink-muted">{o.number(state.reference)}</p>
        <h2 ref={heading} tabIndex={-1} className="text-h2 outline-none">
          {o.thanks}
        </h2>
        <p className="max-w-2xl text-lead text-ink">
          {state.emailed ? o.emailed : o.whatsappFirst}
        </p>
        {state.emailed ? <p className="text-ink-muted">{o.whatsappOptional}</p> : null}
        <div className="flex flex-wrap gap-3">
          <Button
            href={state.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            variant={state.emailed ? "secondary" : "primary"}
            withArrow
          >
            {o.whatsapp}
          </Button>
          <Button href="/" variant="link">
            {o.keepShopping}
          </Button>
        </div>
      </div>
      <aside className="flex h-fit flex-col gap-6 rounded-card border border-line bg-background p-6">
        <h3 className="font-serif text-h3">{o.items}</h3>
        <OrderLines order={state.order} />
        <Totals order={state.order} />
      </aside>
    </div>
  );
}

const FIELD_ERRORS: Record<OrderField, string> = {
  email: copy.errors.email,
  phone: copy.errors.phone,
  fullName: copy.errors.fullName,
  line1: copy.errors.line1,
  city: copy.errors.city,
  zone: copy.errors.zone,
};

export function CheckoutForm({ catalog, rates, browseHref }: CheckoutFormProps) {
  const uid = useId();
  const cart = useCart();
  const form = useRef<HTMLFormElement>(null);
  const [state, action, placing] = useActionState(placeOrder, INITIAL);
  const [zone, setZone] = useState<DeliveryZone | null>(null);
  // Fields edited since the last submit: their server error is stale, so it is hidden.
  const [edited, setEdited] = useState<ReadonlySet<string>>(new Set());

  const placed = state.status === "placed";
  useEffect(() => {
    if (placed) clearCart();
    if (state.status === "invalid") {
      form.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
    }
  }, [placed, state.status]);

  if (state.status === "placed") return <Confirmation state={state} />;
  if (cart === null)
    return (
      <p role="status" className="text-ink-muted">
        {commerce.cart.loading}
      </p>
    );
  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-start gap-6">
        <p className="text-lead text-ink-muted">{copy.emptyCart}</p>
        <Button href={browseHref} withArrow>
          {commerce.cart.browse}
        </Button>
      </div>
    );
  }

  const order = priceOrder(cart, catalog, rates, zone);
  const error = (field: OrderField) =>
    state.status === "invalid" && state.fields.includes(field) && !edited.has(field)
      ? FIELD_ERRORS[field]
      : undefined;
  const message =
    state.status === "invalid"
      ? copy.errors.invalid
      : state.status === "error"
        ? copy.errors[state.error]
        : "";
  const blocked = order.unavailable.length > 0;
  // React resets the form after each submit; failed submits hand the values back.
  const values = state.status === "invalid" || state.status === "error" ? state.values : {};
  const value = (field: string) => values[field];

  return (
    <form
      ref={form}
      action={action}
      onSubmit={() => setEdited(new Set())}
      onChange={(event) => {
        const target = event.target;
        const name =
          target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement
            ? target.name
            : "";
        if (name && !edited.has(name)) setEdited(new Set(edited).add(name));
      }}
      noValidate
      className="grid gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]"
    >
      <input type="hidden" name="cart" value={JSON.stringify(cart)} />
      {/* Honeypot, hidden from people and assistive tech */}
      <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
        <input name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-col gap-10">
        <fieldset className="flex flex-col gap-4">
          <legend className="mb-4 font-serif text-h3">{copy.contact}</legend>
          <FloatingField
            name="phone"
            defaultValue={value("phone")}
            type="tel"
            label={copy.phone}
            hint={copy.phoneHint}
            autoComplete="tel"
            required
            error={error("phone")}
          />
          <FloatingField
            name="email"
            defaultValue={value("email")}
            type="email"
            label={copy.email}
            hint={copy.emailHint}
            autoComplete="email"
            error={error("email")}
          />
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <legend className="mb-4 font-serif text-h3">{copy.delivery}</legend>
          <FloatingField
            name="fullName"
            defaultValue={value("fullName")}
            label={copy.fullName}
            autoComplete="name"
            required
            error={error("fullName")}
          />
          <FloatingField
            name="line1"
            defaultValue={value("line1")}
            label={copy.line1}
            autoComplete="address-line1"
            required
            error={error("line1")}
          />
          <FloatingField
            name="line2"
            label={copy.line2}
            autoComplete="address-line2"
            defaultValue={value("line2")}
          />
          <FloatingField
            name="city"
            defaultValue={value("city")}
            label={copy.city}
            autoComplete="address-level2"
            required
            error={error("city")}
          />
          <FloatingField
            name="notes"
            control="textarea"
            label={copy.notes}
            defaultValue={value("notes")}
          />
        </fieldset>

        <fieldset
          className="flex flex-col gap-3"
          aria-describedby={error("zone") ? `${uid}-zone-error` : undefined}
        >
          <legend className="mb-4 font-serif text-h3">{copy.zone}</legend>
          {DELIVERY_ZONES.map((option) => {
            const free = rates.freeOver !== null && order.subtotal >= rates.freeOver;
            return (
              <label
                key={option}
                htmlFor={`${uid}-${option}`}
                className="flex min-h-(--size-tap) cursor-pointer items-center justify-between gap-3 rounded-card border border-line bg-background p-4 has-checked:border-ink has-focus-visible:outline-2 has-focus-visible:outline-offset-3 has-focus-visible:outline-primary-dark"
              >
                <span className="flex items-center gap-3">
                  <input
                    id={`${uid}-${option}`}
                    type="radio"
                    name="zone"
                    value={option}
                    required
                    checked={zone === option}
                    onChange={(event) =>
                      setZone(isDeliveryZone(event.target.value) ? event.target.value : null)
                    }
                    className="size-5 accent-primary-dark"
                  />
                  <span className="font-medium">{copy.zones[option]}</span>
                </span>
                <span className="text-small">{free ? copy.free : formatPrice(rates[option])}</span>
              </label>
            );
          })}
          {error("zone") ? (
            <p id={`${uid}-zone-error`} className="px-1 text-small font-medium text-ink">
              {error("zone")}
            </p>
          ) : null}
          {rates.freeOver !== null ? (
            <p className="px-1 text-small text-ink-muted">
              {copy.freeOver(formatPrice(rates.freeOver))}
            </p>
          ) : null}
        </fieldset>

        <section aria-labelledby={`${uid}-payment`} className="flex flex-col gap-2">
          <h2 id={`${uid}-payment`} className="mb-2 font-serif text-h3">
            {copy.payment}
          </h2>
          <p className="font-medium">{copy.paymentCod}</p>
          <p className="text-small text-ink-muted">{copy.paymentNote}</p>
        </section>
      </div>

      <aside className="flex h-fit flex-col gap-6 rounded-card border border-line bg-background p-6 lg:sticky lg:top-28">
        <h2 className="font-serif text-h3">{copy.summary}</h2>
        <OrderLines order={order} />
        <Totals order={order} />
        <p role="status" aria-live="polite" className="min-h-6 text-small font-medium">
          {blocked ? copy.errors.unavailable : message}
        </p>
        <Button type="submit" disabled={placing || blocked} withArrow className="w-full">
          {placing ? copy.placing : copy.place}
        </Button>
      </aside>
    </form>
  );
}
