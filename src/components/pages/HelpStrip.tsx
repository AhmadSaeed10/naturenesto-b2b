import { Reveal } from "@/components/motion/Reveal";
import { needHelp } from "@/content/home";

interface HelpStripProps {
  title?: string;
  body?: string;
}

/** The homepage Need Help channels as a compact strip for inner pages. */
export function HelpStrip({ title = needHelp.title, body }: HelpStripProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 md:px-8 md:pb-24">
      <Reveal className="grid gap-8 border-t border-ink pt-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-16">
        <div className="flex flex-col gap-3">
          <h2 className="text-h3">{title}</h2>
          {body ? <p className="max-w-md text-ink-muted">{body}</p> : null}
        </div>
        <ul className="grid gap-6 sm:grid-cols-3">
          {needHelp.channels.map((channel) => (
            <li key={channel.kind} className="flex min-w-0 flex-col gap-1">
              <span className="eyebrow text-ink-muted">{channel.label}</span>
              <a
                href={channel.href}
                className="inline-flex min-h-(--size-tap) items-center font-serif text-h4 [overflow-wrap:anywhere] text-ink underline-offset-4 hover:underline"
              >
                {channel.display}
              </a>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
