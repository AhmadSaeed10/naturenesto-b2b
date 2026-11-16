import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CtaBand } from "@/components/pages/CtaBand";
import { PageHero } from "@/components/pages/PageHero";
import { ProductRow } from "@/components/shop/ProductRow";
import { needHelp } from "@/content/home";
import { marketplacePage } from "@/content/marketplace";
import { photoImage } from "@/content/photos";
import { spaces, spacesPage } from "@/content/spaces";
import { getCatalog } from "@/lib/catalog";
import { pageMetadata } from "@/lib/seo";

const find = (slug: string) => spaces.find((space) => space.slug === slug);
const whatsappHref = needHelp.channels.find((channel) => channel.kind === "whatsapp")?.href ?? "";

export function generateStaticParams() {
  return spaces.map((space) => ({ slug: space.slug }));
}

export async function generateMetadata({ params }: PageProps<"/spaces/[slug]">): Promise<Metadata> {
  const space = find((await params).slug);
  return space
    ? pageMetadata({ title: space.title, description: space.blurb, path: `/spaces/${space.slug}` })
    : {};
}

export default async function SpacePage({ params }: PageProps<"/spaces/[slug]">) {
  const space = find((await params).slug);
  if (!space) notFound();
  const { products } = await getCatalog(null);
  const picked = space.handles.flatMap((handle) =>
    products.filter((product) => product.href?.endsWith(`/${handle}`)),
  );

  return (
    <>
      <PageHero
        eyebrow={spacesPage.eyebrow}
        title={space.title}
        intro={space.blurb}
        image={photoImage(space.photo, space.photoAlt)}
      />
      <nav aria-label={spacesPage.eyebrow} className="mx-auto max-w-7xl px-4 md:px-8">
        <ul className="flex flex-wrap gap-2">
          {spaces.map((other) => (
            <li key={other.slug}>
              <Link
                href={`/spaces/${other.slug}`}
                aria-current={other.slug === space.slug ? "page" : undefined}
                className="inline-flex min-h-(--size-tap) items-center rounded-pill border border-ink/25 px-4 text-small text-ink transition-colors duration-(--duration-micro) ease-brand hover:border-ink aria-[current=page]:border-ink aria-[current=page]:bg-ink aria-[current=page]:text-background"
              >
                {other.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <ProductRow
        title={space.title}
        empty={spacesPage.empty}
        products={picked}
        whatsappHref={whatsappHref}
        more={marketplacePage.viewAll}
      />
      <CtaBand {...marketplacePage.cta} />
    </>
  );
}
