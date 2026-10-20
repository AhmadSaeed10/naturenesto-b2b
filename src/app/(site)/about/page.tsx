import type { Metadata } from "next";
import Image from "next/image";
import { RichText } from "@/components/cms/RichText";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { FrameCorners } from "@/components/ui/FrameCorners";
import { StubPage } from "@/components/ui/StubPage";
import { stubPages } from "@/content/pages";
import { seo } from "@/content/seo";
import { getPublishedPage } from "@/lib/cms/content";
import { getSiteChrome } from "@/lib/cms/data";
import { richTextPlain } from "@/lib/cms/rich-text";
import { pageMetadata } from "@/lib/seo";

const PATH = "/about";
const HANDLE = "about";
const stub = stubPages.find((page) => page.path === PATH);
const FALLBACK_TITLE = stub?.title ?? "About Us";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPublishedPage(HANDLE);
  const title = page?.seoTitle || page?.title || FALLBACK_TITLE;
  return pageMetadata({
    title,
    description:
      page?.seoDescription ||
      richTextPlain(page?.intro || page?.body || "") ||
      seo.pageDescription(title),
    path: PATH,
  });
}

/** About Us: edited in Keystatic (Pages > About Us). Shows the placeholder until it has a body. */
export default async function AboutPage() {
  const [page, chrome] = await Promise.all([getPublishedPage(HANDLE), getSiteChrome()]);
  if (!page || !page.body.trim()) {
    return <StubPage title={page?.title ?? FALLBACK_TITLE} body={stub?.todo ?? ""} />;
  }

  return (
    <article className="mx-auto flex max-w-7xl flex-col gap-16 px-4 py-20 md:px-8 lg:gap-24 lg:py-28">
      <div
        className={
          page.image
            ? "grid items-center gap-12 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-20"
            : "max-w-4xl"
        }
      >
        <Reveal className="flex flex-col gap-6">
          {page.eyebrow ? <Eyebrow>{page.eyebrow}</Eyebrow> : null}
          <h1 className="text-h1">{page.title}</h1>
          {page.intro ? <p className="max-w-2xl text-lead text-ink">{page.intro}</p> : null}
        </Reveal>
        {page.image ? (
          <Reveal className="relative p-3">
            <FrameCorners className="text-ink/60" />
            <div className="relative aspect-[4/5] overflow-hidden rounded-card bg-surface">
              <Image
                src={page.image.src}
                alt={page.image.alt}
                fill
                priority
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        ) : null}
      </div>

      <Reveal className="max-w-3xl">
        <RichText source={page.body} />
      </Reveal>

      <Reveal className="flex flex-col items-start gap-6 border-t border-line pt-12">
        <Button href={chrome.headerCta.href} withArrow>
          {chrome.headerCta.label}
        </Button>
      </Reveal>
    </article>
  );
}
