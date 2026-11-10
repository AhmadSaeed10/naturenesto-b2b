import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RichText } from "@/components/cms/RichText";
import { Reveal } from "@/components/motion/Reveal";
import { SplitHeading } from "@/components/motion/SplitHeading";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { CareGrid } from "@/components/shop/CareGrid";
import { ProductAccordion, type AccordionItem } from "@/components/shop/ProductAccordion";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductGallery } from "@/components/shop/ProductGallery";
import { ProductPurchase } from "@/components/shop/ProductPurchase";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { FrameCorners } from "@/components/ui/FrameCorners";
import { Icon } from "@/components/ui/Icon";
import { catalogCategories } from "@/content/catalog";
import { commerce } from "@/content/commerce";
import { needHelp } from "@/content/home";
import { site } from "@/content/site";
import { hasCare } from "@/lib/care";
import { richTextPlain } from "@/lib/cms/rich-text";
import { getProduct, listProductHandles } from "@/lib/commerce/products";
import { getRelatedProducts } from "@/lib/commerce/related";
import { PAISA_PER_RUPEE } from "@/lib/money";
import { pageMetadata, siteUrl } from "@/lib/seo";

const copy = commerce.product;
const whatsappHref = needHelp.channels.find((channel) => channel.kind === "whatsapp")?.href ?? "";
// Cache Components needs one param at build; the placeholder renders a 404.
const PLACEHOLDER = "no-products-yet";

export async function generateStaticParams() {
  const handles = await listProductHandles();
  return handles.length ? handles.map((handle) => ({ handle })) : [{ handle: PLACEHOLDER }];
}

export async function generateMetadata({
  params,
}: PageProps<"/products/[handle]">): Promise<Metadata> {
  const product = await getProduct((await params).handle);
  if (!product) return {};
  const image = product.images[0];
  return pageMetadata({
    title: product.seoTitle || product.title,
    description: product.seoDescription || richTextPlain(product.description) || product.title,
    path: `/products/${product.handle}`,
    image: image ? { url: image.src, alt: image.alt || product.title } : undefined,
  });
}

export default async function ProductPage({ params }: PageProps<"/products/[handle]">) {
  const product = await getProduct((await params).handle);
  if (!product) notFound();

  const base = siteUrl();
  const category = catalogCategories.find((entry) => entry.slug === product.categories[0]);
  const related = await getRelatedProducts(product.handle, product.categories);
  const url = `${base}/products/${product.handle}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.title,
      description: richTextPlain(product.description, 500) || undefined,
      image: product.images.map((image) => new URL(image.src, base).toString()),
      sku: product.variants[0]?.sku ?? undefined,
      brand: { "@type": "Brand", name: product.vendor || site.name },
      offers: product.variants.map((variant) => ({
        "@type": "Offer",
        price: (variant.price / PAISA_PER_RUPEE).toFixed(2),
        priceCurrency: "PKR",
        availability: variant.available
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
        url,
        sku: variant.sku ?? undefined,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { name: copy.home, item: base },
        ...(category
          ? [{ name: category.title, item: new URL(category.href, base).toString() }]
          : []),
        { name: product.title, item: url },
      ].map((entry, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: entry.name,
        item: entry.item,
      })),
    },
  ];

  const knowItems: AccordionItem[] = [
    ...(product.care.notes
      ? [
          {
            id: "care",
            title: copy.careNotes,
            open: true,
            content: <p className="whitespace-pre-line">{product.care.notes}</p>,
          },
        ]
      : []),
    {
      id: "delivery",
      title: copy.deliveryTitle,
      open: !product.care.notes,
      content: (
        <div className="flex flex-col gap-3">
          <p>{copy.deliveryBody}</p>
          <Link
            href="/shipping"
            className="text-primary-dark underline underline-offset-4 hover:no-underline"
          >
            {copy.deliveryLink}
          </Link>
        </div>
      ),
    },
  ];

  return (
    <article>
      <script
        type="application/ld+json"
        // Built from typed catalogue data; < is escaped so content cannot close the tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <div className="mx-auto max-w-7xl px-4 pt-8 pb-16 md:px-8 md:pt-12 md:pb-24">
        <nav aria-label={copy.breadcrumb} className="mb-6 md:mb-8">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-small text-ink-muted">
            <li>
              <Link href="/" className="inline-flex min-h-6 items-center hover:text-ink">
                {copy.home}
              </Link>
            </li>
            {category ? (
              <li className="flex items-center gap-2">
                <Icon name="chevron-right" size={14} />
                <Link
                  href={category.href}
                  className="inline-flex min-h-6 items-center hover:text-ink"
                >
                  {category.title}
                </Link>
              </li>
            ) : null}
            <li aria-current="page" className="flex items-center gap-2 text-ink">
              <Icon name="chevron-right" size={14} />
              {product.title}
            </li>
          </ol>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
          <ProductGallery images={product.images} title={product.title} badges={product.badges} />

          <div className="flex flex-col gap-7 lg:sticky lg:top-28 lg:self-start">
            <div className="flex flex-col gap-4">
              <Eyebrow>{product.productType || category?.title || copy.shop}</Eyebrow>
              <SplitHeading as="h1" text={product.title} className="text-h2" />
            </div>
            <ProductPurchase product={product} whatsappHref={whatsappHref} />
            <ul className="flex flex-col gap-3 border-t border-line pt-6 text-small">
              {copy.trust.map((line, index) => (
                <li key={line} className="flex items-center gap-3">
                  <Icon
                    name={index === 0 ? "truck" : "whatsapp"}
                    size={20}
                    className="text-primary-dark"
                  />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {product.description || hasCare(product.care) ? (
        <section className="bg-surface">
          <div
            className={
              product.description
                ? "mx-auto grid max-w-7xl gap-10 px-4 py-16 md:px-8 md:py-24 lg:grid-cols-2 lg:gap-20"
                : "mx-auto flex max-w-7xl flex-col gap-5 px-4 py-16 md:px-8 md:py-24"
            }
          >
            {product.description ? (
              <Reveal className="flex flex-col gap-5">
                <Eyebrow>{copy.details}</Eyebrow>
                <h2 className="text-h3">{copy.about(product.title)}</h2>
                <RichText source={product.description} />
              </Reveal>
            ) : null}
            {hasCare(product.care) ? (
              <Reveal delay={product.description ? 0.08 : 0} className="flex flex-col gap-5">
                <Eyebrow>{copy.careHeading}</Eyebrow>
                <CareGrid care={product.care} />
              </Reveal>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-3xl px-4 py-16 md:px-8 md:py-24">
        <Reveal className="flex flex-col gap-6">
          <h2 className="text-h3">{copy.knowHeading}</h2>
          <ProductAccordion items={knowItems} />
        </Reveal>
      </section>

      {related.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 pb-16 md:px-8 md:pb-24">
          <h2 className="mb-8 text-h3">{copy.related}</h2>
          <Stagger
            as="ul"
            className="grid grid-cols-2 gap-x-4 gap-y-12 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6"
          >
            {related.map((item) => (
              <StaggerItem as="li" key={item.id}>
                <ProductCard product={item} whatsappHref={whatsappHref} />
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      ) : null}

      <section className="mx-auto max-w-7xl px-4 pb-16 md:px-8 md:pb-24">
        <Reveal className="relative flex flex-col items-start gap-5 rounded-card bg-surface p-8 text-ink md:p-14">
          <FrameCorners className="m-4 text-ink/30 md:m-6" />
          <h2 className="text-h3">{copy.consult.title}</h2>
          <p className="max-w-xl text-lead">{copy.consult.body}</p>
          <Button href="/consultation" withArrow>
            {copy.consult.cta}
          </Button>
        </Reveal>
      </section>
    </article>
  );
}
