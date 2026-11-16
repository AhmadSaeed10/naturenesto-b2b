"use client";

import { Icon } from "@/components/ui/Icon";
import { wishlist } from "@/content/wishlist";
import { useWishlist } from "@/lib/wishlist";
import { cn } from "@/lib/utils";

interface WishlistButtonProps {
  handle: string;
  name: string;
  className?: string;
}

export function WishlistButton({ handle, name, className }: WishlistButtonProps) {
  const { has, toggle } = useWishlist();
  const saved = has(handle);
  return (
    <button
      type="button"
      onClick={() => toggle(handle)}
      aria-pressed={saved}
      aria-label={saved ? wishlist.remove(name) : wishlist.add(name)}
      className={cn(
        "inline-flex size-(--size-tap) items-center justify-center rounded-pill bg-background/90 text-ink transition-colors duration-(--duration-micro) ease-brand hover:text-primary-dark",
        className,
      )}
    >
      <Icon
        name="heart"
        size={20}
        className={saved ? "fill-primary-dark text-primary-dark" : undefined}
      />
    </button>
  );
}
