import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { QUOTE_ID, QuoteSection } from "@/components/forms/QuoteSection";
import { Reveal } from "@/components/motion/Reveal";
import { SplitHeading } from "@/components/motion/SplitHeading";
import { ServicesGrid } from "@/components/sections/ServicesGrid";
import { BrandIcon } from "@/components/ui/BrandIcon";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { serviceCopy, serviceDetail } from "@/content/pages-copy";
import { quote } from "@/content/quote";
import { seo } from "@/content/seo";
import { services } from "@/content/services";
import { pageMetadata } from "@/lib/seo";

const SERVICES_TITLE = "Services";

const find = (slug: string) => services.find((service) => service.slug === slug);

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/services/[slug]">): Promise<Metadata> {
  const service = find((await params).slug);
  return service
    ? pageMetadata({
        title: service.title,
        description: serviceCopy[service.slug]?.intro ?? seo.pageDescription(service.title),
        path: service.href,
      })
    : {};
}

export default async function ServicePage({ params }: PageProps<"/services/[slug]">) {
  const service = find((await params).slug);
  if (!service) notFound();
  const copy = serviceCopy[service.slug];

  return (
    <>
      <section className="mx-auto flex max-w-4xl flex-col items-start gap-6 px-4 pt-14 pb-12 md:px-8 md:pt-24 md:pb-16">
        <BrandIcon name={service.icon} size={44} className="text-primary-dark" />
        <Eyebrow>{SERVICES_TITLE}</Eyebrow>
        <SplitHeading as="h1" text={service.title} className="text-h1" />
        {copy ? <p className="max-w-2xl text-lead text-ink-muted">{copy.intro}</p> : null}
        <Button href={`#${QUOTE_ID}`} withArrow>
          {quote.eyebrow}
        </Button>
      </section>
      {copy ? (
        <section className="bg-surface">
          <Reveal className="mx-auto grid max-w-4xl gap-10 px-4 py-14 md:grid-cols-2 md:gap-16 md:px-8 md:py-20">
            <div className="flex flex-col gap-4">
              <h2 className="text-h3">{serviceDetail.includesTitle}</h2>
              <ul className="flex flex-col divide-y divide-line border-y border-line">
                {copy.includes.map((item) => (
                  <li key={item} className="py-3 text-ink-muted">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-4">
              <h2 className="text-h3">{serviceDetail.forWhoTitle}</h2>
              <p className="text-lead text-ink-muted">{copy.forWho}</p>
            </div>
          </Reveal>
        </section>
      ) : null}
      <QuoteSection defaultService={service.title} />
      <div className="pt-20 md:pt-28">
        <ServicesGrid />
      </div>
    </>
  );
}
