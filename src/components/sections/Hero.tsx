import Image from "next/image";
import { Magnetic } from "@/components/motion/Magnetic";
import { Reveal } from "@/components/motion/Reveal";
import { SplitHeading } from "@/components/motion/SplitHeading";
import { Button } from "@/components/ui/Button";
import { FrameCorners } from "@/components/ui/FrameCorners";
import { Icon } from "@/components/ui/Icon";
import { TornEdge } from "@/components/ui/TornEdge";
import { homeHero } from "@/content/home-world";
import { ui } from "@/content/ui";
import { HeroVideo } from "./HeroVideo";
import { type SectionData, sectionFallbacks } from "@/lib/cms/sections";

export const HERO_NEXT_ID = "tagline";
const HERO_TITLE_ID = "hero-title";

interface HeroProps {
  data?: SectionData<"hero">;
}

export function Hero({ data: hero = sectionFallbacks.hero }: HeroProps) {
  return (
    <section
      aria-labelledby={HERO_TITLE_ID}
      // Light focus ring: primaryDark on the dark scrim is below 3:1.
      className="relative isolate flex min-h-[86svh] flex-col justify-end overflow-hidden bg-ink text-background [--focus-ring:var(--color-background)]"
    >
      {/* The poster is decorative background and the LCP element, so it loads first. */}
      <Image
        src={hero.poster.src}
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-30 object-cover"
      />
      <HeroVideo src={hero.video.src} pauseLabel={ui.videoPause} playLabel={ui.videoPlay} />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-linear-to-t from-ink/90 via-ink/45 to-ink/15"
      />

      <div className="mx-auto w-full max-w-7xl px-4 pt-32 pb-24 md:px-8 md:pb-32">
        <div className="relative max-w-4xl p-5 md:p-8">
          <FrameCorners className="text-background/50" />
          <Reveal>
            <p className="mb-5 eyebrow text-surface">{hero.subline}</p>
          </Reveal>
          <SplitHeading
            as="h1"
            id={HERO_TITLE_ID}
            text={hero.headline}
            emphasis={["Nature"]}
            className="text-display"
          />
          <Reveal delay={0.3} className="mt-6 flex flex-col items-start gap-8">
            <p className="max-w-md text-lead text-surface">{hero.secondary}</p>
            <div className="flex flex-wrap gap-3">
              <Magnetic>
                <Button href={hero.cta.href} withArrow>
                  {hero.cta.label}
                </Button>
              </Magnetic>
              <Button href={homeHero.second.href} variant="secondary">
                {homeHero.second.label}
              </Button>
            </div>
          </Reveal>
        </div>
      </div>

      <a
        href={`#${HERO_NEXT_ID}`}
        aria-label={ui.scrollCue}
        className="absolute right-6 bottom-16 hidden min-h-(--size-tap) flex-col items-center gap-2 text-surface md:right-10 md:bottom-20 md:flex"
      >
        <span className="block h-14 w-px origin-top animate-scroll-cue bg-current" />
        <Icon name="arrow-down" size={16} />
      </a>

      <TornEdge className="absolute -bottom-px left-1/2 -translate-x-1/2" />
    </section>
  );
}
