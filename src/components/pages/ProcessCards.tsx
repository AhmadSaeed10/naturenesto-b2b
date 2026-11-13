import { Reveal } from "@/components/motion/Reveal";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { Eyebrow } from "@/components/ui/Eyebrow";

interface ProcessCardsProps {
  eyebrow?: string;
  title: string;
  steps: { title: string; body: string }[];
}

/** Numbered columns that read left to right, a quicker scan than the vertical StepList. */
export function ProcessCards({ eyebrow, title, steps }: ProcessCardsProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
      <Reveal className="mb-12 flex max-w-2xl flex-col gap-4">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h2 className="text-h2">{title}</h2>
      </Reveal>
      <Stagger
        as="ol"
        className="grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2 lg:grid-cols-4"
      >
        {steps.map((step, index) => (
          <StaggerItem
            as="li"
            key={step.title}
            className="flex flex-col gap-4 bg-background p-6 md:p-8"
          >
            <span className="font-serif text-h2 leading-none text-primary-dark">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="font-serif text-h4">{step.title}</h3>
            <p className="text-small text-ink-muted">{step.body}</p>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
