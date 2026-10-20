"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { commerce } from "@/content/commerce";
import { cartCount, useCart } from "@/lib/cart";

/** Header cart link. The count reads browser storage, so it appears after hydration. */
export function CartLink() {
  const count = cartCount(useCart());

  return (
    <Link
      href="/cart"
      aria-label={commerce.cart.link(count)}
      className="relative inline-flex size-(--size-tap) items-center justify-center rounded-pill text-ink transition-colors duration-(--duration-micro) hover:bg-surface"
    >
      <Icon name="bag" size={22} />
      {count > 0 ? (
        <span
          aria-hidden="true"
          className="absolute top-1 right-0.5 min-w-5 rounded-pill bg-primary-dark px-1 text-center text-[0.6875rem] leading-5 font-medium text-background"
        >
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
