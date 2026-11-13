import { SplitHeading } from "@/components/motion/SplitHeading";
import { Eyebrow } from "@/components/ui/Eyebrow";
import type { CatalogCategory } from "@/content/catalog";
import { needHelp } from "@/content/home";
import { shop } from "@/content/shop";
import { getCatalog } from "@/lib/catalog";
import { CategoryChips } from "./CategoryChips";
import { ShopGrid } from "./ShopGrid";

interface CategoryViewProps {
  /** Null renders the all products page. */
  category: CatalogCategory | null;
}

const whatsappHref = needHelp.channels.find((channel) => channel.kind === "whatsapp")?.href ?? "";

export async function CategoryView({ category }: CategoryViewProps) {
  const { products, source } = await getCatalog(category?.slug ?? null);

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
      <Eyebrow className="mb-5">{shop.eyebrow}</Eyebrow>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <SplitHeading as="h1" text={category?.title ?? shop.all.title} className="text-h1" />
      </div>

      <CategoryChips current={category?.slug ?? "all"} />

      {source === "sample" ? (
        <p
          role="note"
          className="mt-6 rounded-card border border-dashed border-ink/30 px-5 py-3 text-small text-ink"
        >
          {shop.sampleNotice}
        </p>
      ) : null}

      {products.length > 0 ? (
        <div className="mt-10">
          <ShopGrid products={products} whatsappHref={whatsappHref} showCategories={!category} />
        </div>
      ) : (
        <p className="mt-10 text-ink-muted">{shop.empty}</p>
      )}
    </section>
  );
}
