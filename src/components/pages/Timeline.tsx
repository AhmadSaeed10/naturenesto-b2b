import { Reveal } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";

interface TimelineProps {
  eyebrow?: string;
  title: string;
  items: { year: string; title: string; body: string }[];
}

/** A hairline spine with the year set large on the left. Stacks on small screens. */
export function Timeline({ eyebrow, title, items }: TimelineProps) {
  return (
    <section className="bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
        <Reveal className="mb-12 flex max-w-2xl flex-col gap-4">
          {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
          <h2 className="text-h2">{title}</h2>
        </Reveal>
        <ol className="relative border-l border-ink/30 pl-6 md:pl-0">
          {items.map((item) => (
            <li
              key={item.year}
              className="relative grid gap-2 pb-12 last:pb-0 md:grid-cols-[10rem_minmax(0,1fr)] md:gap-12 md:border-l md:border-ink/30 md:pl-10"
            >
              <span
                aria-hidden="true"
                className="absolute top-2 -left-[1.875rem] size-2.5 rounded-pill bg-primary md:-left-[0.3125rem]"
              />
              <span className="font-serif text-h3 leading-none text-primary-dark">{item.year}</span>
              <div className="flex max-w-xl flex-col gap-2">
                <h3 className="font-serif text-h4">{item.title}</h3>
                <p className="text-ink-muted">{item.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
