import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { Eyebrow } from "@/components/ui/Eyebrow";
import type { PageImage } from "@/content/pages-copy";
import { ui } from "@/content/ui";
import { cn } from "@/lib/utils";

export interface Tile {
  title: string;
  body?: string;
  /** Without an href the tile is a Coming Soon card. */
  href?: string;
  image: PageImage;
}

interface TileGridProps {
  eyebrow?: string;
  title?: string;
  intro?: string;
  tiles: Tile[];
  /** Columns on large screens. */
  columns?: 2 | 3 | 4;
  id?: string;
}

const COLUMNS = { 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4" } as const;

/** Photo tiles in one quiet grid. The whole tile is the link; no href means Coming Soon. */
export function TileGrid({ eyebrow, title, intro, tiles, columns = 3, id }: TileGridProps) {
  // Without a section title the tiles are the page's first sections, so they take h2.
  const Heading = title ? "h3" : "h2";
  return (
    <section id={id} className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-20">
      {title ? (
        <Reveal className="mb-10 flex max-w-2xl flex-col gap-4">
          {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
          <h2 className="text-h2">{title}</h2>
          {intro ? <p className="text-lead text-ink-muted">{intro}</p> : null}
        </Reveal>
      ) : null}
      <Stagger as="ul" className={cn("grid gap-x-5 gap-y-10 sm:grid-cols-2", COLUMNS[columns])}>
        {tiles.map((tile) => (
          <StaggerItem
            as="li"
            key={tile.title}
            className="group relative flex min-w-0 flex-col gap-4"
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-surface">
              <Image
                src={tile.image.src}
                alt={tile.image.alt}
                fill
                sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                className={cn(
                  "object-cover transition-transform duration-(--duration-reveal) ease-brand group-hover:scale-[1.04]",
                  !tile.href && "opacity-70 grayscale",
                )}
              />
              {!tile.href ? (
                <p className="absolute top-4 left-4 rounded-pill border border-ink bg-background/90 px-3 py-1 eyebrow">
                  {ui.header.comingSoon}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <Heading className="font-serif text-h4">
                {tile.href ? (
                  <Link
                    href={tile.href}
                    className="after:absolute after:inset-0 after:content-['']"
                  >
                    {tile.title}
                  </Link>
                ) : (
                  tile.title
                )}
              </Heading>
              {tile.body ? <p className="text-small text-ink-muted">{tile.body}</p> : null}
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
