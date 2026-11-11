import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RichText } from "@/components/cms/RichText";
import { Reveal } from "@/components/motion/Reveal";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { ProductAccordion, type AccordionItem } from "@/components/shop/ProductAccordion";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductGallery } from "@/components/shop/ProductGallery";
import { ProductReviews, REVIEWS_ID } from "@/components/shop/ProductReviews";
import { RecommendedAdds } from "@/components/shop/RecommendedAdds";
import { Stars } from "@/components/shop/Stars";
import { ProductPurchase } from "@/components/shop/ProductPurchase";
import { Button } from "@/components/ui/Button";
import { FrameCorners } from "@/components/ui/FrameCorners";
import { Icon } from "@/components/ui/Icon";
import { catalogCategories } from "@/content/catalog";
import { commerce } from "@/content/commerce";
import { needHelp } from "@/content/home";
import { site } from "@/content/site";
import { richTextPlain } from "@/lib/cms/rich-text";
import { getProduct, listProductHandles } from "@/lib/commerce/products";
import { getPairingPots, getRelatedProducts } from "@/lib/commerce/related";
import { getProductReviews } from "@/lib/commerce/reviews";
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
  const [related, pots, reviews] = await Promise.all([
    getRelatedProducts(product.handle, product.categories, product.relatedHandles),
    getPairingPots(product.categories),
    getProductReviews(product.handle),
  ]);
  // Small add-on rows under the buy button: related products that can be bought in one click.
  const addOns = related.flatMap((item) =>
    item.quickAddVariantId
      ? [
          {
            variantId: item.quickAddVariantId,
            name: item.name,
            price: item.price,
            image: item.image.src,
            size: item.size ?? null,
          },
        ]
      : [],
  );
  const { summary } = reviews;
  const careChips = (["light", "water", "pet"] as const).flatMap((key) => {
    const value = product.care[key];
    if (!value) return [];
    const group = copy.care[key] as Record<string, string>;
    return group[value] ? [{ key, label: group[value] }] : [];
  });
  const intro = product.shortDescription || richTextPlain(product.description, 220);
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
      ...(summary.count > 0
        ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: summary.average,
              reviewCount: summary.count,
            },
          }
        : {}),
      offers: product.variants.map((variant) => ({
        "@type": "Offer",
        price: (variant.price / PAISA_PER_RUPEE).toFixed(2),
        priceCurrency: "PKR",
        availability: variant.available
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
        url,
        sku: variant.sku ?? undefined,
        ...(variant.barcode && /^\d{8,14}$/.test(variant.barcode) ? { gtin: variant.barcode } : {}),
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
    ...(product.specs.length > 0
      ? [
          {
            id: "specs",
            title: copy.specsTitle,
            open: true,
            content: (
              <dl className="divide-y divide-line">
                {product.specs.map((spec) => (
                  <div
                    key={spec.label}
                    className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 py-2.5"
                  >
                    <dt className="text-ink-muted">{spec.label}</dt>
                    <dd>{spec.value}</dd>
                  </div>
                ))}
              </dl>
            ),
          },
        ]
      : []),
    ...(product.included.length > 0
      ? [
          {
            id: "included",
            title: copy.includedTitle,
            content: (
              <ul className="flex list-disc flex-col gap-1.5 pl-5">
                {product.included.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ),
          },
        ]
      : []),
    ...(product.care.notes
      ? [
          {
            id: "care",
            title: copy.careNotes,
            content: <p className="whitespace-pre-line">{product.care.notes}</p>,
          },
        ]
      : []),
    {
      id: "delivery",
      title: copy.deliveryTitle,
      open: false,
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

  const faqItems: AccordionItem[] = copy.faq.map((entry, index) => ({
    id: `faq-${index}`,
    title: entry.q,
    content: <p>{entry.a}</p>,
  }));

  return (
    <article>
      <script
        type="application/ld+json"
        // Built from typed catalogue data; < is escaped so content cannot close the tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <section className="bg-background">
        <div className="mx-auto max-w-7xl px-4 pt-6 pb-12 md:px-8 md:pt-8 md:pb-20">
          <nav aria-label={copy.breadcrumb} className="mb-6">
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

          <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-start lg:gap-16">
            <ProductGallery images={product.images} title={product.title} badges={product.badges} />

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <h1 className="text-h3">{product.title}</h1>
                <a
                  href={`#${REVIEWS_ID}`}
                  className="inline-flex w-fit items-center gap-2 text-small text-ink-muted hover:text-ink"
                >
                  {summary.count > 0 ? (
                    <>
                      <Stars value={summary.average} />
                      <span>
                        {summary.average.toFixed(1)} ({copy.reviews.count(summary.count)})
                      </span>
                    </>
                  ) : (
                    copy.reviews.write
                  )}
                </a>
                {careChips.length > 0 ? (
                  <ul className="flex flex-wrap gap-2">
                    {careChips.map((chip) => (
                      <li
                        key={chip.key}
                        className="rounded-pill bg-surface px-3 py-1.5 text-small text-ink"
                      >
                        {chip.label}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {intro ? <p className="font-serif text-lead text-ink italic">{intro}</p> : null}
              </div>

              <ProductPurchase
                product={product}
                whatsappHref={whatsappHref}
                pots={pots}
                image={product.images[0]}
              />

              <RecommendedAdds items={addOns} />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12 md:px-8 md:py-20">
        <Reveal className="flex flex-col gap-10">
          {product.description ? (
            <div className="flex flex-col gap-4">
              <h2 className="text-h3">{copy.about(product.title)}</h2>
              <div className="text-lead [&_p]:mb-4">
                <RichText source={product.description} />
              </div>
            </div>
          ) : null}
          <ProductAccordion items={[...knowItems, ...faqItems]} />
        </Reveal>
      </section>

      <ProductReviews handle={product.handle} data={reviews} />

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
