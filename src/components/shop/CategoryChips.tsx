import Link from "next/link";
import { catalogCategories } from "@/content/catalog";
import { shop } from "@/content/shop";
import type { CatalogSlug } from "@/content/types";
import { cn } from "@/lib/utils";

interface CategoryChipsProps {
  current: CatalogSlug | "all";
}

/** Sideways wayfinding between shop pages. Scrolls horizontally on small screens. */
export function CategoryChips({ current }: CategoryChipsProps) {
  return (
    <nav
      aria-label={shop.browse}
      className="-mx-4 max-w-[100vw] min-w-0 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0"
    >
      <ul className="flex w-max gap-2 md:w-auto md:flex-wrap">
        <li>
          <Link
            href="/shop"
            aria-current={current === "all" ? "page" : undefined}
            className={cn(
              "inline-flex min-h-(--size-tap) items-center rounded-pill border px-4 text-small whitespace-nowrap transition-colors duration-(--duration-micro) ease-brand",
              current === "all"
                ? "border-ink bg-ink text-background"
                : "border-ink/25 text-ink hover:border-ink",
            )}
          >
            {shop.all.chip}
          </Link>
        </li>
        {catalogCategories.map((category) => {
          const active = category.slug === current;
          return (
            <li key={category.slug}>
              <Link
                href={category.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-(--size-tap) items-center rounded-pill border px-4 text-small whitespace-nowrap transition-colors duration-(--duration-micro) ease-brand",
                  active
                    ? "border-ink bg-ink text-background"
                    : "border-ink/25 text-ink hover:border-ink",
                )}
              >
                {category.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
