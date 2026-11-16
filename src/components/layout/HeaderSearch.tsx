import { Suspense } from "react";
import { formatPrice } from "@/lib/format";
import { getCatalog } from "@/lib/catalog";
import { SearchDialog, type SearchItem } from "./SearchDialog";

async function Loaded() {
  const { products } = await getCatalog(null);
  const items: SearchItem[] = products.flatMap((product) =>
    product.href
      ? [
          {
            name: product.name,
            href: product.href,
            price: formatPrice(product.price),
            size: product.size,
          },
        ]
      : [],
  );
  return <SearchDialog items={items} />;
}

export function HeaderSearch() {
  return (
    <Suspense fallback={<SearchDialog items={[]} />}>
      <Loaded />
    </Suspense>
  );
}
