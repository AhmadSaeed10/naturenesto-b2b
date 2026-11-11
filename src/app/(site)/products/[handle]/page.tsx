import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RichText } from "@/components/cms/RichText";
import { Reveal } from "@/components/motion/Reveal";
import { SplitHeading } from "@/components/motion/SplitHeading";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { CareChapters } from "@/components/shop/CareChapters";
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
import { richTextPlain } from "@/lib/cms/rich-text";
import { getProduct, listProductHandles } from "@/lib/commerce/products";
import { getPairingPots, getRelatedProducts } from "@/lib/commerce/related";
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
  const [related, pots] = await Promise.all([
    getRelatedProducts(product.handle, product.categories),
    getPairingPots(product.categories),
  ]);
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

      <section className="relative overflow-hidden bg-surface">
        <div className="relative mx-auto max-w-7xl px-4 pt-8 pb-12 md:px-8 md:pt-10 md:pb-20">
          <nav aria-label={copy.breadcrumb} className="mb-8">
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

          <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-14">
            <div className="relative">
              <FrameCorners className="-m-3 text-ink/50" />
              <ProductGallery
                images={product.images}
                title={product.title}
                badges={product.badges}
              />
            </div>

            <div className="relative flex flex-col gap-6 rounded-card border-[1.5px] border-ink bg-background p-6 md:p-8 lg:sticky lg:top-28">
              <div className="flex flex-col gap-4">
                <ul className="flex flex-wrap gap-2">
                  {[product.productType || category?.title || copy.shop, product.care.size]
                    .filter(Boolean)
                    .map((label) => (
                      <li
                        key={label}
                        className="rounded-[6px] border border-dashed border-ink/50 px-2.5 py-1 eyebrow text-ink"
                      >
                        {label}
                      </li>
                    ))}
                </ul>
                <SplitHeading as="h1" text={product.title} className="text-h1" />
              </div>
              <ProductPurchase
                product={product}
                whatsappHref={whatsappHref}
                pots={pots}
                image={product.images[0]}
              />
              <ul className="flex flex-col gap-3 border-t border-line pt-5 text-small">
                {copy.trust.map((item) => (
                  <li key={item.text} className="flex items-center gap-3">
                    <Icon name={item.icon} size={20} className="text-primary-dark" />
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {product.description ? (
        <section className="mx-auto max-w-4xl px-4 py-20 md:px-8 md:py-32">
          <Reveal className="flex flex-col gap-6">
            <Eyebrow>{copy.plate.notes}</Eyebrow>
            <div className="font-serif text-h3 leading-snug [&_p]:mb-5">
              <RichText source={product.description} />
            </div>
          </Reveal>
        </section>
      ) : null}

      <CareChapters data={product.care} />

      <section className="mx-auto max-w-3xl px-4 py-16 md:px-8 md:py-24">
        <Reveal className="flex flex-col gap-6">
          <h2 className="text-h3">{copy.knowHeading}</h2>
          <ProductAccordion items={knowItems} />
          <h2 className="mt-10 text-h3">{copy.faqHeading}</h2>
          <ProductAccordion items={faqItems} />
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
