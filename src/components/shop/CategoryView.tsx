import { SplitHeading } from "@/components/motion/SplitHeading";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { Eyebrow } from "@/components/ui/Eyebrow";
import type { CatalogCategory } from "@/content/catalog";
import { needHelp } from "@/content/home";
import { shop } from "@/content/shop";
import { getCatalog } from "@/lib/catalog";
import { CategoryChips } from "./CategoryChips";
import { ProductCard } from "./ProductCard";

interface CategoryViewProps {
  category: CatalogCategory;
}

const whatsappHref = needHelp.channels.find((channel) => channel.kind === "whatsapp")?.href ?? "";

export async function CategoryView({ category }: CategoryViewProps) {
  const { products, hasSamples } = await getCatalog(category.slug);

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
      <Eyebrow className="mb-5">{shop.eyebrow}</Eyebrow>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <SplitHeading as="h1" text={category.title} className="text-h1" />
        <p className="text-ink-muted">{shop.productCount(products.length)}</p>
      </div>

      <CategoryChips current={category.slug} />

      {hasSamples ? (
        <p
          role="note"
          className="mt-6 rounded-card border border-dashed border-ink/30 px-5 py-3 text-small text-ink"
        >
          {shop.sampleNotice}
        </p>
      ) : null}

      {products.length > 0 ? (
        <Stagger
          as="ul"
          className="mt-10 grid grid-cols-2 gap-x-4 gap-y-12 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6"
        >
          {products.map((product, index) => (
            <StaggerItem as="li" key={product.id}>
              <ProductCard product={product} whatsappHref={whatsappHref} priority={index < 4} />
            </StaggerItem>
          ))}
        </Stagger>
      ) : (
        <p className="mt-10 text-ink-muted">{shop.empty}</p>
      )}
    </section>
  );
}
