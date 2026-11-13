import { Reveal } from "@/components/motion/Reveal";
import { CtaBand } from "@/components/pages/CtaBand";
import { FounderNote } from "@/components/pages/FounderNote";
import { PageHero } from "@/components/pages/PageHero";
import { PhotoMosaic } from "@/components/pages/PhotoMosaic";
import { SplitFeature } from "@/components/pages/SplitFeature";
import { StatsBand } from "@/components/pages/StatsBand";
import { Timeline } from "@/components/pages/Timeline";
import { storyPage as copy } from "@/content/pages-copy";
import { founder, mosaic, stats, timeline } from "@/content/pages-extra";
import { seo } from "@/content/seo";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Our Story",
  description: seo.pageDescription("Our Story"),
  path: "/our-story",
});

export default function OurStoryPage() {
  return (
    <>
      <PageHero eyebrow={copy.eyebrow} title={copy.title} intro={copy.intro} image={copy.image} />
      {copy.chapters.map((chapter, index) => (
        <SplitFeature key={chapter.title} {...chapter} reverse={index % 2 === 1} />
      ))}
      <Timeline {...timeline} />
      <StatsBand items={stats} />
      <FounderNote {...founder} />
      <section className="bg-surface">
        <Reveal className="mx-auto max-w-4xl px-4 py-20 text-center md:px-8 md:py-28">
          <blockquote className="font-serif text-h2 text-balance italic">{copy.quote}</blockquote>
        </Reveal>
      </section>
      <PhotoMosaic images={mosaic} />
      <div className="pt-16 md:pt-24">
        <CtaBand {...copy.cta} />
      </div>
    </>
  );
}
