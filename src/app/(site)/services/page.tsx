import { SplitHeading } from "@/components/motion/SplitHeading";
import { StatsBand } from "@/components/pages/StatsBand";
import { Testimonials } from "@/components/pages/Testimonials";
import { QUOTE_ID, QuoteSection } from "@/components/forms/QuoteSection";
import { ServicesGrid } from "@/components/sections/ServicesGrid";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { servicesIndex, stats, testimonials } from "@/content/pages-extra";
import { quote } from "@/content/quote";
import { seo } from "@/content/seo";
import { site } from "@/content/site";
import { pageMetadata } from "@/lib/seo";

const TITLE = "Services";

export const metadata = pageMetadata({
  title: TITLE,
  description: seo.pageDescription(TITLE),
  path: "/services",
});

export default function ServicesPage() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pt-16 pb-12 md:px-8 md:pt-24">
        <Eyebrow className="mb-5">{site.name}</Eyebrow>
        <div className="flex flex-wrap items-end justify-between gap-8">
          <SplitHeading as="h1" text={TITLE} className="text-h1" />
          <Button href={`#${QUOTE_ID}`} variant="secondary" withArrow>
            {quote.eyebrow}
          </Button>
        </div>
      </section>
      <ServicesGrid />
      <StatsBand items={stats} />
      <Testimonials {...testimonials} {...servicesIndex.testimonials} />
      <QuoteSection />
    </>
  );
}
