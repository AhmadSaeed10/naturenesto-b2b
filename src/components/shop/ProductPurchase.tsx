"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { commerce } from "@/content/commerce";
import { shop } from "@/content/shop";
import { MAX_QUANTITY, addToCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { BulkQuote } from "./BulkQuote";

const copy = commerce.product;

interface ProductPurchaseProps {
  product: {
    handle: string;
    name: string;
    price: number;
    compareAtPrice?: number;
    size?: string;
    inStock: boolean;
  };
  whatsappHref: string;
}

export function ProductPurchase({ product, whatsappHref }: ProductPurchaseProps) {
  const uid = useId();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const price = formatPrice(product.price);
  const label = product.size ? `${product.name} (${product.size})` : product.name;
  const enquiry = `${whatsappHref}?text=${encodeURIComponent(shop.whatsappMessage(label, price))}`;

  function add() {
    addToCart(product.handle, quantity);
    setAdded(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="flex items-baseline gap-3 text-h4">
        <span className="font-medium">{price}</span>
        {product.compareAtPrice ? (
          <s className="text-lead text-ink-muted">{formatPrice(product.compareAtPrice)}</s>
        ) : null}
      </p>
      {product.size ? <p className="-mt-3 text-ink-muted">{product.size}</p> : null}

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-2">
          <label htmlFor={`${uid}-qty`} className="text-small font-medium">
            {copy.quantity}
          </label>
          <input
            id={`${uid}-qty`}
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_QUANTITY}
            value={quantity}
            onChange={(event) =>
              setQuantity(Math.max(1, Math.min(MAX_QUANTITY, Number(event.target.value) || 1)))
            }
            className="min-h-(--size-tap) w-24 rounded-pill border border-ink-muted bg-background px-4 text-center"
          />
        </div>
        {product.inStock ? (
          <Button type="button" onClick={add} withArrow>
            {copy.addToCart}
          </Button>
        ) : (
          <p className="inline-flex min-h-(--size-tap) items-center font-medium text-ink-muted">
            {copy.outOfStock}
          </p>
        )}
      </div>

      <div
        role="status"
        aria-live="polite"
        className="-mt-2 flex min-h-6 flex-wrap items-center gap-3 text-small"
      >
        {added ? (
          <>
            {copy.added}
            <Link href="/cart" className="text-primary-dark underline underline-offset-4">
              {copy.viewCart}
            </Link>
          </>
        ) : null}
      </div>

      <BulkQuote handle={product.handle} productName={label} whatsappHref={whatsappHref} />

      <div>
        <Button href={enquiry} target="_blank" rel="noopener noreferrer" variant="link">
          {copy.enquire}
        </Button>
      </div>
    </div>
  );
}
