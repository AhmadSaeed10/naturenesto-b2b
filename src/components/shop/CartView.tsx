"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { commerce } from "@/content/commerce";
import type { CartProduct } from "@/lib/catalog";
import { MAX_QUANTITY, setCartQuantity, useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";

const copy = commerce.cart;
const SELECT_MAX = 20;

interface CartViewProps {
  catalog: Record<string, CartProduct>;
  browseHref: string;
}

export function CartView({ catalog, browseHref }: CartViewProps) {
  const cart = useCart();

  if (cart === null) {
    return (
      <p role="status" className="text-ink-muted">
        {copy.loading}
      </p>
    );
  }
  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-start gap-6">
        <p className="text-lead text-ink-muted">{copy.empty}</p>
        <Button href={browseHref} withArrow>
          {copy.browse}
        </Button>
      </div>
    );
  }

  const subtotal = cart.reduce((sum, line) => {
    const product = catalog[line.handle];
    return product?.inStock ? sum + product.price * line.quantity : sum;
  }, 0);
  const blocked = cart.some((line) => !catalog[line.handle]?.inStock);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <ul className="flex flex-col divide-y divide-line">
        {cart.map((line) => {
          const product = catalog[line.handle];
          const title = product?.name ?? line.handle;
          const options = Array.from(
            { length: Math.min(MAX_QUANTITY, Math.max(line.quantity, SELECT_MAX)) },
            (_, i) => i + 1,
          );
          return (
            <li
              key={line.handle}
              className="grid grid-cols-[5rem_minmax(0,1fr)] gap-4 py-6 sm:grid-cols-[6rem_minmax(0,1fr)_auto]"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-surface">
                {product ? (
                  <Image src={product.image} alt="" fill sizes="96px" className="object-cover" />
                ) : null}
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                {product ? (
                  <Link
                    href={`/products/${line.handle}`}
                    className="font-serif text-h4 text-ink underline-offset-4 hover:underline"
                  >
                    {title}
                  </Link>
                ) : (
                  <p className="font-serif text-h4 text-ink">{title}</p>
                )}
                {product?.size ? <p className="text-small text-ink-muted">{product.size}</p> : null}
                {product ? <p className="text-small">{formatPrice(product.price)}</p> : null}
                {!product?.inStock ? (
                  <p className="text-small font-medium text-ink" role="alert">
                    {copy.unavailable}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  {product?.inStock ? (
                    <>
                      <label className="sr-only" htmlFor={`qty-${line.handle}`}>
                        {copy.quantity(title)}
                      </label>
                      <select
                        id={`qty-${line.handle}`}
                        value={line.quantity}
                        onChange={(event) =>
                          setCartQuantity(line.handle, Number(event.target.value))
                        }
                        className="min-h-(--size-tap) rounded-pill border border-ink-muted bg-background px-4"
                      >
                        {options.map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setCartQuantity(line.handle, 0)}
                    className="inline-flex min-h-(--size-tap) items-center text-small text-primary-dark underline underline-offset-4"
                  >
                    {copy.remove}
                    <span className="sr-only">: {title}</span>
                  </button>
                </div>
              </div>
              {product?.inStock ? (
                <p className="col-start-2 font-medium sm:col-start-3 sm:text-right">
                  {formatPrice(product.price * line.quantity)}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
      <aside className="flex h-fit flex-col gap-4 rounded-card border border-line bg-background p-6">
        <p className="flex justify-between text-lead">
          <span>{copy.subtotal}</span>
          <span className="font-medium">{formatPrice(subtotal)}</span>
        </p>
        <p className="text-small text-ink-muted">{copy.shippingNote}</p>
        {blocked ? (
          <p className="text-small font-medium text-ink">{commerce.checkout.errors.unavailable}</p>
        ) : (
          <Button href="/checkout" withArrow className="w-full">
            {copy.checkout}
          </Button>
        )}
      </aside>
    </div>
  );
}
