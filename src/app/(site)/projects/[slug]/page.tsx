import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/motion/Reveal";
import { CtaBand } from "@/components/pages/CtaBand";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { photoImage } from "@/content/photos";
import { projects, projectsPage as copy } from "@/content/projects";
import { pageMetadata } from "@/lib/seo";

const find = (slug: string) => projects.find((project) => project.slug === slug);

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const project = find((await params).slug);
  return project
    ? pageMetadata({
        title: project.title,
        description: project.summary,
        path: `/projects/${project.slug}`,
      })
    : {};
}

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const project = find((await params).slug);
  if (!project) notFound();
  const before = photoImage(project.photo, project.photoAlt);
  const after = photoImage(project.after, project.afterAlt);

  return (
    <>
      <section className="mx-auto flex max-w-7xl flex-col gap-6 px-4 pt-12 pb-10 md:px-8 md:pt-20">
        <Link
          href="/projects"
          className="inline-flex min-h-(--size-tap) items-center text-small text-primary-dark underline underline-offset-4"
        >
          {copy.back}
        </Link>
        <Eyebrow>
          {project.type} · {project.location}
        </Eyebrow>
        <h1 className="max-w-3xl text-h1">{project.title}</h1>
        <p className="max-w-2xl text-lead text-ink-muted">{project.summary}</p>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 pb-16 md:grid-cols-2 md:px-8">
        {[
          { label: copy.beforeLabel, image: before },
          { label: copy.afterLabel, image: after },
        ].map((item) => (
          <figure key={item.label} className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-surface">
              <Image
                src={item.image.src}
                alt={item.image.alt}
                fill
                sizes="(min-width: 768px) 45vw, 90vw"
                className="object-cover"
                priority
              />
            </div>
            <figcaption className="absolute top-4 left-4 rounded-pill bg-background/90 px-3 py-1 eyebrow">
              {item.label}
            </figcaption>
          </figure>
        ))}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 md:px-8 md:pb-24">
        <Reveal className="grid gap-10 border-t border-ink pt-10 lg:grid-cols-3 lg:gap-16">
          <div className="flex flex-col gap-3">
            <h2 className="text-h4">{copy.briefLabel}</h2>
            <p className="text-ink-muted">{project.brief}</p>
          </div>
          <div className="flex flex-col gap-3">
            <h2 className="text-h4">{copy.conceptLabel}</h2>
            <p className="text-ink-muted">{project.concept}</p>
          </div>
          <div className="flex flex-col gap-3">
            <h2 className="text-h4">{copy.servicesLabel}</h2>
            <ul className="flex flex-col">
              {project.services.map((service) => (
                <li key={service.href}>
                  <Link
                    href={service.href}
                    className="inline-flex min-h-(--size-tap) items-center text-primary-dark underline underline-offset-4"
                  >
                    {service.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </section>
      <CtaBand {...copy.cta} />
    </>
  );
}
