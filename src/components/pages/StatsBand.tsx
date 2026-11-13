import { Stagger, StaggerItem } from "@/components/motion/Stagger";

interface StatsBandProps {
  items: { value: string; label: string }[];
}

/** Big serif figures between hairlines. Figures are copy, so they stay editable in src/content. */
export function StatsBand({ items }: StatsBandProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 md:px-8 md:py-20">
      <Stagger
        as="ul"
        className="grid grid-cols-2 gap-y-10 border-y border-line py-10 md:grid-cols-4 md:py-14"
      >
        {items.map((item) => (
          <StaggerItem
            as="li"
            key={item.label}
            className="flex flex-col gap-2 border-line px-2 md:border-l md:px-8 md:first:border-l-0"
          >
            <span className="font-serif text-h1 leading-none text-ink">{item.value}</span>
            <span className="eyebrow text-ink-muted">{item.label}</span>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
