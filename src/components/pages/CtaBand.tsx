import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import type { PageCta } from "@/content/pages-copy";

interface CtaBandProps {
  title: string;
  body: string;
  primary: PageCta;
  secondary?: PageCta;
}

export function CtaBand({ title, body, primary, secondary }: CtaBandProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 md:px-8 md:pb-24">
      <Reveal className="flex flex-col items-start gap-5 rounded-card bg-surface p-8 text-ink md:items-center md:p-16 md:text-center">
        <h2 className="max-w-2xl text-h2">{title}</h2>
        <p className="max-w-xl text-lead text-ink-muted">{body}</p>
        <div className="flex flex-wrap gap-3 pt-2 md:justify-center">
          <Button href={primary.href} withArrow>
            {primary.label}
          </Button>
          {secondary ? (
            <Button href={secondary.href} variant="secondary">
              {secondary.label}
            </Button>
          ) : null}
        </div>
      </Reveal>
    </section>
  );
}
