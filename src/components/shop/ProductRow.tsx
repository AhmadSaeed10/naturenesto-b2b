import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import type { Product } from "@/content/types";
import { ProductCard } from "./ProductCard";

interface ProductRowProps {
  id?: string;
  title: string;
  empty: string;
  products: Product[];
  whatsappHref: string;
  more?: { label: string; href: string };
}

/** A titled grid of product cards, used for curated lists on hub pages. */
export function ProductRow({ id, title, empty, products, whatsappHref, more }: ProductRowProps) {
  return (
    <section id={id} className="mx-auto max-w-7xl scroll-mt-28 px-4 py-12 md:px-8 md:py-20">
      <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <h2 className="text-h2">{title}</h2>
        {more ? (
          <Button href={more.href} variant="secondary">
            {more.label}
          </Button>
        ) : null}
      </Reveal>
      {products.length === 0 ? (
        <p className="text-ink-muted">{empty}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-14 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
          {products.map((product) => (
            <li key={product.id} className="min-w-0">
              <ProductCard product={product} whatsappHref={whatsappHref} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
