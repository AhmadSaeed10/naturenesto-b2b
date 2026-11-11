import Image from "next/image";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import type { PageImage } from "@/content/pages-copy";
import { cn } from "@/lib/utils";

interface SplitFeatureProps {
  eyebrow?: string;
  title: string;
  paragraphs: string[];
  image: PageImage;
  reverse?: boolean;
  cta?: { label: string; href: string };
}

export function SplitFeature({
  eyebrow,
  title,
  paragraphs,
  image,
  reverse = false,
  cta,
}: SplitFeatureProps) {
  return (
    <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 md:px-8 md:py-20 lg:grid-cols-2 lg:gap-20">
      <Reveal className={cn("relative", reverse && "lg:order-2")}>
        <div className="relative aspect-[5/4] overflow-hidden rounded-card bg-surface">
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="(min-width: 1024px) 46vw, 100vw"
            className="object-cover"
          />
        </div>
      </Reveal>
      <Reveal className="flex max-w-lg flex-col gap-5">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h2 className="text-h2">{title}</h2>
        {paragraphs.map((text) => (
          <p key={text} className="text-lead text-ink-muted">
            {text}
          </p>
        ))}
        {cta ? (
          <div className="pt-2">
            <Button href={cta.href} variant="secondary" withArrow>
              {cta.label}
            </Button>
          </div>
        ) : null}
      </Reveal>
    </section>
  );
}
