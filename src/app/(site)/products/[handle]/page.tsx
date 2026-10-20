import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RichText } from "@/components/cms/RichText";
import { Reveal } from "@/components/motion/Reveal";
import { ProductPurchase } from "@/components/shop/ProductPurchase";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { commerce } from "@/content/commerce";
import { shop } from "@/content/shop";
import { site } from "@/content/site";
import { getProduct, listProductHandles } from "@/lib/catalog";
import { getSiteChrome } from "@/lib/cms/data";
import { richTextPlain } from "@/lib/cms/rich-text";
import { pageMetadata, siteUrl } from "@/lib/seo";

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
  return pageMetadata({
    title: product.seoTitle || product.name,
    description: product.seoDescription || richTextPlain(product.description) || product.name,
    path: `/products/${product.handle}`,
  });
}

export default async function ProductPage({ params }: PageProps<"/products/[handle]">) {
  const [product, chrome] = await Promise.all([getProduct((await params).handle), getSiteChrome()]);
  if (!product) notFound();

  const base = siteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: richTextPlain(product.description, 500) || undefined,
    image: product.images.map((image) => new URL(image.src, base).toString()),
    sku: product.handle,
    brand: { "@type": "Brand", name: site.name },
    offers: {
      "@type": "Offer",
      price: product.price.toFixed(2),
      priceCurrency: "PKR",
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `${base}/products/${product.handle}`,
    },
  };
  const [hero, ...rest] = product.images;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-20">
      <script
        type="application/ld+json"
        // Built from typed catalogue data; < is escaped so content cannot close the tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Link
        href="/pots-and-planters"
        className="mb-8 inline-flex min-h-(--size-tap) items-center text-small text-primary-dark underline-offset-4 hover:underline"
      >
        {commerce.product.back}
      </Link>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
        <div className="flex flex-col gap-4">
          {hero ? (
            <div className="relative aspect-[4/5] overflow-hidden rounded-card bg-surface">
              <Image
                src={hero.src}
                alt={hero.alt}
                fill
                priority
                sizes="(min-width: 1024px) 55vw, 100vw"
                className="object-cover"
              />
            </div>
          ) : null}
          {rest.length ? (
            <ul className="grid grid-cols-2 gap-4">
              {rest.map((image) => (
                <li
                  key={image.src}
                  className="relative aspect-square overflow-hidden rounded-card bg-surface"
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="(min-width: 1024px) 27vw, 50vw"
                    className="object-cover"
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <Reveal className="flex flex-col gap-8 lg:sticky lg:top-28 lg:self-start">
          <div className="flex flex-col gap-4">
            <Eyebrow>{shop.eyebrow}</Eyebrow>
            <h1 className="text-h2">{product.name}</h1>
            {product.sample ? (
              <p role="note" className="text-small text-ink-muted">
                {shop.sampleNotice}
              </p>
            ) : null}
          </div>
          <ProductPurchase product={product} whatsappHref={chrome.whatsappHref} />
          {product.description ? (
            <div className="flex flex-col gap-3 border-t border-line pt-6">
              <h2 className="eyebrow text-ink-muted">{commerce.product.details}</h2>
              <RichText source={product.description} />
            </div>
          ) : null}
        </Reveal>
      </div>
    </section>
  );
}
