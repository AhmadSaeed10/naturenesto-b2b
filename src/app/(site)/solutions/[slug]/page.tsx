import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/motion/Reveal";
import { CtaBand } from "@/components/pages/CtaBand";
import { HelpStrip } from "@/components/pages/HelpStrip";
import { PageHero } from "@/components/pages/PageHero";
import { ProcessCards } from "@/components/pages/ProcessCards";
import { TileGrid } from "@/components/pages/TileGrid";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { photoImage } from "@/content/photos";
import { solutions, solutionsPage } from "@/content/solutions";
import { pageMetadata } from "@/lib/seo";

const find = (slug: string) => solutions.find((item) => item.slug === slug);

export function generateStaticParams() {
  return solutions.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/solutions/[slug]">): Promise<Metadata> {
  const item = find((await params).slug);
  return item
    ? pageMetadata({ title: item.title, description: item.intro, path: `/solutions/${item.slug}` })
    : {};
}

export default async function SolutionPage({ params }: PageProps<"/solutions/[slug]">) {
  const item = find((await params).slug);
  if (!item) notFound();
  const others = solutions.filter((other) => other.slug !== item.slug);

  return (
    <>
      <PageHero
        eyebrow={solutionsPage.eyebrow}
        title={item.title}
        intro={item.intro}
        image={photoImage(item.photo, item.photoAlt)}
      />
      <section className="mx-auto max-w-7xl px-4 pb-16 md:px-8 md:pb-24">
        <Reveal className="grid gap-8 border-t border-ink pt-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-16">
          <div className="flex flex-col gap-3">
            <Eyebrow>{solutionsPage.offersEyebrow}</Eyebrow>
            <h2 className="text-h3">{solutionsPage.offersTitle}</h2>
          </div>
          <ul className="grid gap-x-10 sm:grid-cols-2">
            {item.offers.map((offer) => (
              <li key={offer} className="border-b border-line py-4 text-lead">
                {offer}
              </li>
            ))}
          </ul>
        </Reveal>
      </section>
      <ProcessCards {...solutionsPage.process} />
      <CtaBand {...solutionsPage.cta} />
      <TileGrid
        eyebrow={solutionsPage.moreEyebrow}
        title={solutionsPage.moreTitle}
        columns={4}
        tiles={others.map((other) => ({
          title: other.title,
          body: other.short,
          href: `/solutions/${other.slug}`,
          image: photoImage(other.photo, other.photoAlt),
        }))}
      />
      <HelpStrip />
    </>
  );
}
