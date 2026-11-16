import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { CtaBand } from "@/components/pages/CtaBand";
import { SplitFeature } from "@/components/pages/SplitFeature";
import { TileGrid } from "@/components/pages/TileGrid";
import { ValueGrid } from "@/components/pages/ValueGrid";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import {
  homeFinal,
  homeIntro,
  homeMarketplace,
  homeProjects,
  homeSolutions,
  homeSpaces,
  homeWhy,
  homeWorld,
} from "@/content/home-world";
import { photoImage } from "@/content/photos";
import { projects } from "@/content/projects";
import { solutions } from "@/content/solutions";
import { spaces } from "@/content/spaces";

/** Marketplace sections that follow the hero, in the order set by the strategy chat. */
export function HomeIntro() {
  return (
    <SplitFeature
      eyebrow={homeIntro.eyebrow}
      title={homeIntro.title}
      paragraphs={homeIntro.paragraphs}
      image={photoImage(homeIntro.photo, homeIntro.photoAlt)}
      cta={homeIntro.cta}
    />
  );
}

export function HomeExplore() {
  return (
    <TileGrid
      eyebrow={homeWorld.eyebrow}
      title={homeWorld.title}
      tiles={homeWorld.tiles.map((tile) => ({
        title: tile.title,
        body: tile.body,
        href: tile.href,
        image: photoImage(tile.photo, tile.alt),
      }))}
    />
  );
}

export function HomeSolutions() {
  return (
    <>
      <TileGrid
        eyebrow={homeSolutions.eyebrow}
        title={homeSolutions.title}
        intro={homeSolutions.intro}
        tiles={solutions.map((solution) => ({
          title: solution.title,
          body: solution.short,
          href: `/solutions/${solution.slug}`,
          image: photoImage(solution.photo, solution.photoAlt),
        }))}
      />
      <div className="mx-auto max-w-7xl px-4 pb-12 md:px-8 md:pb-20">
        <Button href={homeSolutions.cta.href} variant="secondary" withArrow>
          {homeSolutions.cta.label}
        </Button>
      </div>
    </>
  );
}

export function HomeMarketplace() {
  const image = photoImage(homeMarketplace.photo, homeMarketplace.photoAlt);
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-20">
      <Reveal className="relative isolate overflow-hidden rounded-card bg-ink text-background [--focus-ring:var(--color-background)]">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes="(min-width: 1280px) 1200px, 100vw"
          className="-z-20 object-cover"
        />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-ink/65" />
        <div className="flex max-w-2xl flex-col items-start gap-5 p-8 md:p-16">
          <Eyebrow className="text-surface">{homeMarketplace.eyebrow}</Eyebrow>
          <h2 className="text-h2">{homeMarketplace.title}</h2>
          <p className="text-lead text-surface">{homeMarketplace.body}</p>
          <Button href={homeMarketplace.cta.href} withArrow>
            {homeMarketplace.cta.label}
          </Button>
        </div>
      </Reveal>
    </section>
  );
}

export function HomeSpaces() {
  return (
    <>
      <TileGrid
        eyebrow={homeSpaces.eyebrow}
        title={homeSpaces.title}
        columns={4}
        tiles={spaces.map((space) => ({
          title: space.title,
          href: `/spaces/${space.slug}`,
          image: photoImage(space.photo, space.photoAlt),
        }))}
      />
      <div className="mx-auto max-w-7xl px-4 pb-12 md:px-8 md:pb-20">
        <Link
          href={homeSpaces.cta.href}
          className="inline-flex min-h-(--size-tap) items-center text-primary-dark underline underline-offset-4"
        >
          {homeSpaces.cta.label}
        </Link>
      </div>
    </>
  );
}

export function HomeProjects() {
  const featured = homeProjects.slugs.flatMap((slug) => projects.filter((p) => p.slug === slug));
  return (
    <>
      <TileGrid
        eyebrow={homeProjects.eyebrow}
        title={homeProjects.title}
        intro={homeProjects.intro}
        tiles={featured.map((project) => ({
          title: project.title,
          body: `${project.type} · ${project.location}`,
          href: `/projects/${project.slug}`,
          image: photoImage(project.photo, project.photoAlt),
        }))}
      />
      <div className="mx-auto max-w-7xl px-4 pb-12 md:px-8 md:pb-20">
        <Button href={homeProjects.cta.href} variant="secondary" withArrow>
          {homeProjects.cta.label}
        </Button>
      </div>
    </>
  );
}

export function HomeWhy() {
  return <ValueGrid eyebrow={homeWhy.eyebrow} title={homeWhy.title} items={homeWhy.items} />;
}

export function HomeFinal() {
  return (
    <div className="pt-16 md:pt-24">
      <CtaBand
        title={homeFinal.title}
        body={homeFinal.body}
        primary={homeFinal.primary}
        secondary={homeFinal.secondary}
      />
    </div>
  );
}
