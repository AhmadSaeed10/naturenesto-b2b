"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { addToCart } from "@/app/actions/cart";
import { commerce } from "@/content/commerce";
import type { PairingPot } from "@/lib/commerce/related";
import { formatPrice } from "@/lib/format";
import { CART_EVENT, openCart } from "./cart-events";

const copy = commerce.product.recommend;

/** Compact "add this too" rows under the main button, like a small upsell list. */
export function RecommendedAdds({ items }: { items: PairingPot[] }) {
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [done, setDone] = useState<string[]>([]);
  if (items.length === 0) return null;

  function add(id: string) {
    setBusy(id);
    startTransition(async () => {
      const result = await addToCart(id, 1);
      if (result.ok) {
        setDone((list) => [...list, id]);
        window.dispatchEvent(new CustomEvent(CART_EVENT, { detail: result.count }));
        openCart();
      }
      setBusy(null);
    });
  }

  return (
    <section aria-labelledby="recommend-title" className="flex flex-col gap-4">
      <h2 id="recommend-title" className="text-h4">
        {copy.title}
      </h2>
      <ul className="flex flex-col gap-3">
        {items.slice(0, 3).map((item) => (
          <li
            key={item.variantId}
            className="flex items-center gap-4 rounded-2xl border border-line bg-surface/50 p-3"
          >
            <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-surface">
              <Image src={item.image} alt="" fill sizes="64px" className="object-cover" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{item.name}</span>
              <span className="text-small text-ink-muted">{formatPrice(item.price)}</span>
            </span>
            <button
              type="button"
              disabled={pending && busy === item.variantId}
              onClick={() => add(item.variantId)}
              className="inline-flex min-h-(--size-tap) shrink-0 items-center rounded-pill bg-primary-dark px-5 text-small font-medium text-background transition-colors duration-(--duration-micro) ease-brand hover:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark disabled:opacity-60"
            >
              {done.includes(item.variantId) ? copy.added : copy.add}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
