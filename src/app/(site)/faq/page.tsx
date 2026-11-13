import { RichText } from "@/components/cms/RichText";
import { CtaBand } from "@/components/pages/CtaBand";
import { HelpStrip } from "@/components/pages/HelpStrip";
import { Reveal } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { StubPage } from "@/components/ui/StubPage";
import { cms } from "@/content/cms";
import { faqExtra as extra } from "@/content/pages-extra";
import { stubPages } from "@/content/pages";
import { seo } from "@/content/seo";
import { listFaq } from "@/lib/cms/content";
import { pageMetadata } from "@/lib/seo";

const stub = stubPages.find((page) => page.path === "/faq");

export const metadata = pageMetadata({
  title: cms.faq.title,
  description: seo.pageDescription(cms.faq.title),
  path: "/faq",
});

export default async function FaqPage() {
  const items = await listFaq();
  if (items.length === 0)
    return (
      <>
        <StubPage title={stub?.title ?? cms.faq.title} body={stub?.todo ?? ""} />
        <HelpStrip body={extra.help} />
      </>
    );

  // Grouped by category in first appearance order; uncategorised questions come last.
  const groups = new Map<string, typeof items>();
  for (const item of items) {
    const key = item.category?.trim() || cms.faq.other;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  return (
    <>
      <section className="mx-auto flex max-w-4xl flex-col gap-12 px-4 py-16 md:px-8 lg:py-24">
        <Reveal className="flex flex-col gap-6">
          <Eyebrow>{cms.faq.eyebrow}</Eyebrow>
          <h1 className="text-h1">{cms.faq.title}</h1>
        </Reveal>
        {[...groups.entries()].map(([group, questions]) => (
          <section key={group} aria-label={group} className="flex flex-col gap-2">
            {groups.size > 1 ? <h2 className="font-serif text-h3">{group}</h2> : null}
            {questions.map((item) => (
              // Native disclosure: keyboard and screen reader support without script.
              <details key={item.id} className="group border-b border-line py-1 open:pb-5">
                <summary className="flex min-h-(--size-tap) cursor-pointer list-none items-center justify-between gap-4 py-3 font-medium">
                  {item.question}
                  <span
                    aria-hidden="true"
                    className="text-primary-dark transition-transform duration-(--duration-micro) group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <RichText source={item.answer} />
              </details>
            ))}
          </section>
        ))}
      </section>
      <HelpStrip body={extra.help} />
      <CtaBand {...extra.cta} />
    </>
  );
}
