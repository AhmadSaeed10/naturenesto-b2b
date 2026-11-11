import { Reveal } from "@/components/motion/Reveal";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { Eyebrow } from "@/components/ui/Eyebrow";

interface ValueGridProps {
  eyebrow?: string;
  title: string;
  items: { title: string; body: string }[];
}

/** Numbered columns separated by hairlines; no cards, no icons, as on thesill.com. */
export function ValueGrid({ eyebrow, title, items }: ValueGridProps) {
  return (
    <section className="bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
        <Reveal className="mb-12 flex max-w-2xl flex-col gap-4">
          {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
          <h2 className="text-h2">{title}</h2>
        </Reveal>
        <Stagger
          as="ul"
          className="grid gap-10 border-t border-line pt-10 md:grid-cols-3 md:gap-12"
        >
          {items.map((item, index) => (
            <StaggerItem as="li" key={item.title} className="flex flex-col gap-3">
              <span className="eyebrow text-ink-muted">{String(index + 1).padStart(2, "0")}</span>
              <h3 className="font-serif text-h4">{item.title}</h3>
              <p className="text-ink-muted">{item.body}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
