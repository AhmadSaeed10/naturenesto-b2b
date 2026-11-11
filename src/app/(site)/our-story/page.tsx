import { Reveal } from "@/components/motion/Reveal";
import { CtaBand } from "@/components/pages/CtaBand";
import { PageHero } from "@/components/pages/PageHero";
import { SplitFeature } from "@/components/pages/SplitFeature";
import { storyPage as copy } from "@/content/pages-copy";
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
      <section className="bg-surface">
        <Reveal className="mx-auto max-w-4xl px-4 py-20 text-center md:px-8 md:py-28">
          <blockquote className="font-serif text-h2 text-balance italic">{copy.quote}</blockquote>
        </Reveal>
      </section>
      <div className="pt-16 md:pt-24">
        <CtaBand {...copy.cta} />
      </div>
    </>
  );
}
