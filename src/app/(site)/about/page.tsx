import { CtaBand } from "@/components/pages/CtaBand";
import { PageHero } from "@/components/pages/PageHero";
import { SplitFeature } from "@/components/pages/SplitFeature";
import { StepList } from "@/components/pages/StepList";
import { ValueGrid } from "@/components/pages/ValueGrid";
import { aboutPage as copy } from "@/content/pages-copy";
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
      <SplitFeature
        eyebrow={copy.what.eyebrow}
        title={copy.what.title}
        paragraphs={copy.what.paragraphs}
        image={copy.what.image}
        cta={copy.what.cta}
      />
      <ValueGrid title={copy.valuesTitle} items={copy.values} />
      <StepList eyebrow={copy.stepsEyebrow} title={copy.stepsTitle} steps={steps} />
      <CtaBand {...copy.cta} />
    </>
  );
}
