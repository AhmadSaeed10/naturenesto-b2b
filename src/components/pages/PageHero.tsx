import Image from "next/image";
import { Reveal } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { FrameCorners } from "@/components/ui/FrameCorners";
import type { PageImage } from "@/content/pages-copy";

interface PageHeroProps {
  eyebrow: string;
  title: string;
  intro: string;
  image?: PageImage;
}

/** Quiet opening for inner pages: text left, one large photo right, one frame accent. */
export function PageHero({ eyebrow, title, intro, image }: PageHeroProps) {
  return (
    <section className="mx-auto grid max-w-7xl gap-10 px-4 pt-12 pb-16 md:px-8 md:pt-20 md:pb-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-16">
      <Reveal className="flex flex-col gap-6">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="max-w-xl text-h1">{title}</h1>
        <p className="max-w-lg text-lead text-ink-muted">{intro}</p>
      </Reveal>
      {image ? (
        <Reveal className="relative">
          <div className="relative aspect-[4/5] overflow-hidden rounded-card bg-surface">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              priority
              sizes="(min-width: 1024px) 46vw, 100vw"
              className="object-cover"
            />
          </div>
          <FrameCorners className="m-3 text-background/80" />
        </Reveal>
      ) : null}
    </section>
  );
}
