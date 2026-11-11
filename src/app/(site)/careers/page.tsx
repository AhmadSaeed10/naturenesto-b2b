import { Reveal } from "@/components/motion/Reveal";
import { PageHero } from "@/components/pages/PageHero";
import { ValueGrid } from "@/components/pages/ValueGrid";
import { Button } from "@/components/ui/Button";
import { careersPage as copy } from "@/content/pages-copy";
import { seo } from "@/content/seo";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Career",
  description: seo.pageDescription("Career"),
  path: "/careers",
});

export default function CareersPage() {
  return (
    <>
      <PageHero eyebrow={copy.eyebrow} title={copy.title} intro={copy.intro} image={copy.image} />
      <ValueGrid title={copy.whyTitle} items={copy.why} />
      <section className="mx-auto max-w-3xl px-4 py-16 md:px-8 md:py-24">
        <Reveal className="flex flex-col gap-6">
          <h2 className="text-h2">{copy.rolesTitle}</h2>
          <p className="text-lead text-ink-muted">{copy.rolesEmpty}</p>
          <div>
            <Button href={copy.apply.href} withArrow>
              {copy.apply.label}
            </Button>
          </div>
        </Reveal>
      </section>
    </>
  );
}
