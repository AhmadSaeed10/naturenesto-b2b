import Image from "next/image";
import { Reveal } from "@/components/motion/Reveal";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { Eyebrow } from "@/components/ui/Eyebrow";
import type { PageImage } from "@/content/pages-copy";

interface TeamGridProps {
  eyebrow?: string;
  title: string;
  intro?: string;
  people: { name: string; role: string; body: string; image: PageImage }[];
}

/** Portrait cards on the stamp edge used by product cards. Photos are stand-ins for portraits. */
export function TeamGrid({ eyebrow, title, intro, people }: TeamGridProps) {
  return (
    <section className="bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
        <Reveal className="mb-12 flex max-w-2xl flex-col gap-4">
          {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
          <h2 className="text-h2">{title}</h2>
          {intro ? <p className="text-lead text-ink-muted">{intro}</p> : null}
        </Reveal>
        <Stagger as="ul" className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {people.map((person) => (
            <StaggerItem as="li" key={person.name} className="flex min-w-0 flex-col gap-4">
              <div className="bg-background stamp">
                <div className="relative aspect-[4/5] overflow-hidden">
                  <Image
                    src={person.image.src}
                    alt={person.image.alt}
                    fill
                    sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 90vw"
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1 border-t-[1.5px] border-ink pt-3">
                <h3 className="font-serif text-h4">{person.name}</h3>
                <p className="eyebrow text-primary-dark">{person.role}</p>
                <p className="pt-1 text-small text-ink-muted">{person.body}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
