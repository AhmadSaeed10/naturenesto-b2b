import { Reveal } from "@/components/motion/Reveal";
import { Eyebrow } from "@/components/ui/Eyebrow";

interface StepListProps {
  eyebrow?: string;
  title: string;
  steps: { number: string; title: string; body: string }[];
}

export function StepList({ eyebrow, title, steps }: StepListProps) {
  return (
    <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:px-8 md:py-24 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-20">
      <Reveal className="flex flex-col gap-4 lg:sticky lg:top-28 lg:self-start">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h2 className="text-h2">{title}</h2>
      </Reveal>
      <ol className="divide-y divide-line border-y border-line">
        {steps.map((step) => (
          <li key={step.number} className="grid gap-2 py-7 sm:grid-cols-[4rem_minmax(0,1fr)]">
            <span className="pt-1.5 eyebrow text-ink-muted">{step.number}</span>
            <div className="flex flex-col gap-2">
              <h3 className="font-serif text-h4">{step.title}</h3>
              <p className="text-ink-muted">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
