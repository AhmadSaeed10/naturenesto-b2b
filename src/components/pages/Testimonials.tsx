import { Reveal } from "@/components/motion/Reveal";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { Eyebrow } from "@/components/ui/Eyebrow";

interface TestimonialsProps {
  eyebrow?: string;
  title: string;
  items: { quote: string; name: string; place: string }[];
}

/** One large quote, then the rest in a quieter row. */
export function Testimonials({ eyebrow, title, items }: TestimonialsProps) {
  const [lead, ...rest] = items;
  if (!lead) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
      <Reveal className="mb-12 flex max-w-2xl flex-col gap-4">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h2 className="text-h2">{title}</h2>
      </Reveal>
      <Reveal className="border-t border-line pt-10">
        <figure className="flex flex-col gap-6">
          <blockquote className="max-w-4xl font-serif text-h2 leading-tight text-ink">
            &ldquo;{lead.quote}&rdquo;
          </blockquote>
          <figcaption className="text-small text-ink-muted">
            <span className="font-medium text-ink">{lead.name}</span>, {lead.place}
          </figcaption>
        </figure>
      </Reveal>
      {rest.length > 0 ? (
        <Stagger as="ul" className="mt-12 grid gap-10 border-t border-line pt-10 md:grid-cols-2">
          {rest.map((item) => (
            <StaggerItem as="li" key={item.name} className="flex flex-col gap-4">
              <p className="text-lead text-ink">&ldquo;{item.quote}&rdquo;</p>
              <p className="text-small text-ink-muted">
                <span className="font-medium text-ink">{item.name}</span>, {item.place}
              </p>
            </StaggerItem>
          ))}
        </Stagger>
      ) : null}
    </section>
  );
}
