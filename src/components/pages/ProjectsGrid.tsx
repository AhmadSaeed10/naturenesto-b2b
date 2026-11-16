"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import type { PageImage } from "@/content/pages-copy";
import { cn } from "@/lib/utils";

export interface ProjectCardData {
  slug: string;
  title: string;
  location: string;
  type: string;
  summary: string;
  image: PageImage;
}

interface ProjectsGridProps {
  projects: ProjectCardData[];
  allLabel: string;
}

/** Project cards with a type filter. Filtering is client side: the list is short. */
export function ProjectsGrid({ projects, allLabel }: ProjectsGridProps) {
  const [type, setType] = useState<string | null>(null);
  const types = [...new Set(projects.map((project) => project.type))];
  const shown = type ? projects.filter((project) => project.type === type) : projects;

  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 md:px-8 md:pb-24">
      <div className="mb-10 flex flex-wrap gap-2" role="group" aria-label={allLabel}>
        {[null, ...types].map((value) => (
          <button
            key={value ?? "all"}
            type="button"
            aria-pressed={type === value}
            onClick={() => setType(value)}
            className={cn(
              "inline-flex min-h-(--size-tap) items-center rounded-pill border px-4 text-small transition-colors duration-(--duration-micro) ease-brand",
              type === value
                ? "border-ink bg-ink text-background"
                : "border-ink/25 text-ink hover:border-ink",
            )}
          >
            {value ?? allLabel}
          </button>
        ))}
      </div>
      <Stagger
        as="ul"
        key={type ?? "all"}
        className="grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3"
      >
        {shown.map((project) => (
          <StaggerItem
            as="li"
            key={project.slug}
            className="group relative flex min-w-0 flex-col gap-4"
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-surface">
              <Image
                src={project.image.src}
                alt={project.image.alt}
                fill
                sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                className="object-cover transition-transform duration-(--duration-reveal) ease-brand group-hover:scale-[1.04]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="eyebrow text-primary-dark">
                {project.type} · {project.location}
              </p>
              <h2 className="font-serif text-h4">
                <Link
                  href={`/projects/${project.slug}`}
                  className="after:absolute after:inset-0 after:content-['']"
                >
                  {project.title}
                </Link>
              </h2>
              <p className="text-small text-ink-muted">{project.summary}</p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
