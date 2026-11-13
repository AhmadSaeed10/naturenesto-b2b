import { CtaBand } from "@/components/pages/CtaBand";
import { FounderNote } from "@/components/pages/FounderNote";
import { PageHero } from "@/components/pages/PageHero";
import { PhotoMosaic } from "@/components/pages/PhotoMosaic";
import { SplitFeature } from "@/components/pages/SplitFeature";
import { StatsBand } from "@/components/pages/StatsBand";
import { StepList } from "@/components/pages/StepList";
import { TeamGrid } from "@/components/pages/TeamGrid";
import { Testimonials } from "@/components/pages/Testimonials";
import { ValueGrid } from "@/components/pages/ValueGrid";
import { aboutPage as copy } from "@/content/pages-copy";
import { founder, mosaic, stats, team, testimonials } from "@/content/pages-extra";
import { seo } from "@/content/seo";
import { steps } from "@/content/steps";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "About Us",
  description: seo.pageDescription("About Us"),
  path: "/about",
});

export default function AboutPage() {
  return (
    <>
      <PageHero eyebrow={copy.eyebrow} title={copy.title} intro={copy.intro} image={copy.image} />
      <StatsBand items={stats} />
      <SplitFeature
        eyebrow={copy.what.eyebrow}
        title={copy.what.title}
        paragraphs={copy.what.paragraphs}
        image={copy.what.image}
        cta={copy.what.cta}
      />
      <ValueGrid title={copy.valuesTitle} items={copy.values} />
      <FounderNote {...founder} />
      <TeamGrid {...team} />
      <StepList eyebrow={copy.stepsEyebrow} title={copy.stepsTitle} steps={steps} />
      <Testimonials {...testimonials} />
      <PhotoMosaic images={mosaic} />
      <CtaBand {...copy.cta} />
    </>
  );
}
