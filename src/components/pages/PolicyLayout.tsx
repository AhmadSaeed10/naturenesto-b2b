import { Eyebrow } from "@/components/ui/Eyebrow";
import type { PolicySection } from "@/content/pages-copy";

interface PolicyLayoutProps {
  eyebrow: string;
  title: string;
  intro: string;
  updated?: string;
  sections: PolicySection[];
  /** Optional block between the intro and the long text, such as key facts. */
  lead?: React.ReactNode;
}

/** Long reading pages: sticky contents list on the left, plain prose on the right. */
export function PolicyLayout({
  eyebrow,
  title,
  intro,
  updated,
  sections,
  lead,
}: PolicyLayoutProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-12 pb-20 md:px-8 md:pt-20 md:pb-28">
      <header className="flex max-w-2xl flex-col gap-5 pb-12 md:pb-16">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="text-h1">{title}</h1>
        <p className="text-lead text-ink-muted">{intro}</p>
        {updated ? <p className="text-small text-ink-muted">{updated}</p> : null}
      </header>
      {lead}
      <div className="grid gap-12 border-t border-line pt-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.4fr)] lg:gap-20">
        <nav aria-label={title} className="lg:sticky lg:top-28 lg:self-start">
          <ol className="flex flex-col gap-1 text-small">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="inline-flex min-h-(--size-tap) items-center text-ink-muted underline-offset-4 hover:text-ink hover:underline"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div className="flex max-w-2xl flex-col gap-12">
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="flex scroll-mt-28 flex-col gap-4">
              <h2 className="text-h3">{section.title}</h2>
              {section.paragraphs?.map((text) => (
                <p key={text} className="text-lead text-ink-muted">
                  {text}
                </p>
              ))}
              {section.bullets ? (
                <ul className="flex list-disc flex-col gap-2 pl-5 text-lead text-ink-muted">
                  {section.bullets.map((text) => (
                    <li key={text}>{text}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
