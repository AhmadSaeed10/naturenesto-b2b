"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { commerce } from "@/content/commerce";

import { CartDrawer } from "./CartDrawer";
import { CART_EVENT, openCart } from "./cart-events";

export { CART_EVENT };

export function CartLink({ initialCount }: { initialCount: number }) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    const onChange = (event: Event) => {
      if (event instanceof CustomEvent && typeof event.detail === "number") setCount(event.detail);
    };
    window.addEventListener(CART_EVENT, onChange);
    return () => window.removeEventListener(CART_EVENT, onChange);
  }, []);

  return (
    <>
      <Link
        href="/cart"
        onClick={(event) => {
          // Plain clicks open the drawer; modified clicks still open the cart page.
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
          event.preventDefault();
          openCart();
        }}
        aria-label={commerce.cart.link(count)}
        className="relative inline-flex size-(--size-tap) items-center justify-center rounded-pill text-ink transition-colors duration-(--duration-micro) hover:bg-surface"
      >
        <Icon name="bag" size={22} />
        {count > 0 ? (
          <span
            aria-hidden="true"
            className="absolute top-1 right-0.5 min-w-5 rounded-pill bg-primary-dark px-1 text-center text-xs leading-5 font-medium text-background"
          >
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </Link>
      <CartDrawer />
    </>
  );
}
