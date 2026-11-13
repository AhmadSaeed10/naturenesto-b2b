import Image from "next/image";
import { Reveal } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { FrameCorners } from "@/components/ui/FrameCorners";
import type { PageImage } from "@/content/pages-copy";

interface FounderNoteProps {
  eyebrow?: string;
  quote: string;
  name: string;
  role: string;
  image: PageImage;
}

export function FounderNote({ eyebrow, quote, name, role, image }: FounderNoteProps) {
  return (
    <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 md:px-8 md:py-24 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-20">
      <Reveal className="relative mx-auto w-full max-w-sm lg:mx-0">
        <div className="relative aspect-[4/5] overflow-hidden rounded-card bg-surface">
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="(min-width: 1024px) 32vw, 90vw"
            className="object-cover"
          />
        </div>
        <FrameCorners className="-m-3 text-ink" />
      </Reveal>
      <Reveal className="flex flex-col gap-6">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <blockquote className="font-serif text-h2 leading-tight text-ink">
          &ldquo;{quote}&rdquo;
        </blockquote>
        <p className="border-t border-line pt-4">
          <span className="block font-medium text-ink">{name}</span>
          <span className="text-small text-ink-muted">{role}</span>
        </p>
      </Reveal>
    </section>
  );
}
