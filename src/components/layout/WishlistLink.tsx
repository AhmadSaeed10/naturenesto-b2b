"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { ui } from "@/content/ui";
import { useWishlist } from "@/lib/wishlist";

export function WishlistLink() {
  const { count } = useWishlist();
  return (
    <Link
      href="/wishlist"
      aria-label={ui.header.wishlist(count)}
      className="relative hidden size-(--size-tap) items-center justify-center rounded-pill text-ink transition-colors duration-(--duration-micro) hover:bg-surface sm:inline-flex"
    >
      <Icon name="heart" size={22} />
      {count > 0 ? (
        <span
          aria-hidden="true"
          className="absolute top-1 right-0.5 min-w-5 rounded-pill bg-primary-dark px-1 text-center text-xs leading-5 font-medium text-background"
        >
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
