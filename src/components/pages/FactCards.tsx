import { Stagger, StaggerItem } from "@/components/motion/Stagger";

interface FactCardsProps {
  /** Drop the page container when placed inside one that already pads. */
  flush?: boolean;
  items: { label: string; title: string; body: string }[];
}

/** Key facts as a row of quiet cards, shown before the long text. */
export function FactCards({ items, flush = false }: FactCardsProps) {
  return (
    <section className={flush ? "pb-12 md:pb-16" : "mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14"}>
      <Stagger as="ul" className="grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <StaggerItem
            as="li"
            key={item.label}
            className="flex flex-col gap-3 rounded-card bg-surface p-6 md:p-8"
          >
            <span className="eyebrow text-ink-muted">{item.label}</span>
            <h2 className="font-serif text-h4">{item.title}</h2>
            <p className="text-small text-ink-muted">{item.body}</p>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
