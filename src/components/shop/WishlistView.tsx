"use client";

import { Button } from "@/components/ui/Button";
import { wishlist } from "@/content/wishlist";
import type { Product } from "@/content/types";
import { useWishlist } from "@/lib/wishlist";
import { ProductCard } from "./ProductCard";

interface WishlistViewProps {
  products: Product[];
  whatsappHref: string;
}

/** Saved products live in the browser; the server passes the catalogue and this filters it. */
export function WishlistView({ products, whatsappHref }: WishlistViewProps) {
  const { handles } = useWishlist();
  const saved = products.filter((product) => {
    const handle = product.href?.split("/").pop() ?? product.id;
    return handles.includes(handle);
  });

  if (saved.length === 0) {
    return (
      <div className="flex flex-col items-start gap-5 py-6">
        <p className="text-lead text-ink-muted">{wishlist.empty}</p>
        <Button href="/marketplace" withArrow>
          {wishlist.browse}
        </Button>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-14 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
      {saved.map((product) => (
        <li key={product.id} className="min-w-0">
          <ProductCard product={product} whatsappHref={whatsappHref} />
        </li>
      ))}
    </ul>
  );
}
