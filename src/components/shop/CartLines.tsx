"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setCartQuantity } from "@/app/actions/cart";
import { commerce } from "@/content/commerce";
import type { QuoteLine } from "@/lib/commerce/cart";
import { formatPaisa } from "@/lib/money";
import { CART_EVENT } from "./cart-events";

const copy = commerce.cart;

/** Lines with live quantity changes; the server re-prices after each change. */
export function CartLines({
  lines,
  images,
}: {
  lines: QuoteLine[];
  images: Record<string, string | null>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const change = (line: QuoteLine, quantity: number) =>
    startTransition(async () => {
      const result = await setCartQuantity(line.variantId, quantity);
      if (result.ok) window.dispatchEvent(new CustomEvent(CART_EVENT, { detail: result.count }));
      router.refresh();
    });

  return (
    <ul className="flex flex-col divide-y divide-line" aria-busy={pending}>
      {lines.map((line) => {
        const limit = line.trackInventory && !line.allowBackorder ? line.stock : 99;
        const problem = !line.available
          ? copy.unavailable
          : line.quantity > limit
            ? copy.notEnough(limit)
            : null;
        const image = images[line.variantId];
        return (
          <li
            key={line.variantId}
            className="grid grid-cols-[5rem_minmax(0,1fr)] gap-4 py-6 sm:grid-cols-[6rem_minmax(0,1fr)_auto]"
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-surface">
              {image ? (
                <Image src={image} alt="" fill sizes="96px" className="object-cover" />
              ) : null}
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <Link
                href={`/products/${line.handle}`}
                className="font-serif text-h4 text-ink underline-offset-4 hover:underline"
              >
                {line.title}
              </Link>
              {line.variantTitle !== "Default" ? (
                <p className="text-small text-ink-muted">{line.variantTitle}</p>
              ) : null}
              <p className="text-small">{formatPaisa(line.unitPrice)}</p>
              {problem ? (
                <p className="text-small font-medium text-ink" role="alert">
                  {problem}
                </p>
              ) : null}
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <label className="sr-only" htmlFor={`qty-${line.variantId}`}>
                  {copy.quantity(line.title)}
                </label>
                <select
                  id={`qty-${line.variantId}`}
                  value={line.quantity}
                  disabled={pending}
                  onChange={(event) => change(line, Number(event.target.value))}
                  className="min-h-(--size-tap) rounded-pill border border-ink-muted bg-background px-4"
                >
                  {Array.from(
                    { length: Math.max(line.quantity, Math.min(limit, 20)) },
                    (_, i) => i + 1,
                  ).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => change(line, 0)}
                  className="inline-flex min-h-(--size-tap) items-center text-small text-primary-dark underline underline-offset-4"
                >
                  {copy.remove}
                  <span className="sr-only">: {line.title}</span>
                </button>
              </div>
            </div>
            <p className="col-start-2 font-medium sm:col-start-3 sm:text-right">
              {formatPaisa(line.lineTotal)}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
