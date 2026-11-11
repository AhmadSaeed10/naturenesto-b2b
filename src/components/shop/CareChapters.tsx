import { Reveal } from "@/components/motion/Reveal";
import { Icon, type UiIconName } from "@/components/ui/Icon";
import { commerce } from "@/content/commerce";
import { type Care, hasCare } from "@/lib/care";
import { cn } from "@/lib/utils";

const care = commerce.product.care;
const chapters = commerce.product.chapters;
const gauge = commerce.product.plate.gauge;

const LEVEL = { low: 1, medium: 2, bright: 3, moderate: 2, frequent: 3 } as const;

interface Chapter {
  key: string;
  icon: UiIconName;
  label: string;
  value: string;
  story: string;
  level?: 1 | 2 | 3;
}

function build(c: Care): Chapter[] {
  const list: Chapter[] = [];
  if (c.light) {
    list.push({
      key: "light",
      icon: "sun",
      label: chapters.light.title,
      value: care.light[c.light],
      story: chapters.light[c.light],
      level: LEVEL[c.light],
    });
  }
  if (c.water) {
    list.push({
      key: "water",
      icon: "drop",
      label: chapters.water.title,
      value: care.water[c.water],
      story: chapters.water[c.water],
      level: LEVEL[c.water],
    });
  }
  if (c.pet || c.size) {
    list.push({
      key: "place",
      icon: c.pet ? "paw" : "ruler",
      label: chapters.place.title,
      value: c.pet ? care.pet[c.pet] : c.size,
      story: chapters.place[c.pet || "none"],
    });
  }
  return list;
}

/**
 * Care told as three scroll chapters. The numeral and title stay pinned on large screens while
 * the story scrolls past, so the page reads like a short feature rather than a spec table.
 */
export function CareChapters({ data }: { data: Care }) {
  if (!hasCare(data)) return null;
  const items = build(data);
  if (items.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 md:px-8">
      <ol>
        {items.map((chapter, index) => (
          <li
            key={chapter.key}
            className="grid gap-8 border-t-[1.5px] border-ink py-14 md:py-20 lg:min-h-[78svh] lg:grid-cols-2 lg:gap-20"
          >
            <div className="flex flex-col gap-4 lg:sticky lg:top-32 lg:self-start">
              <span
                aria-hidden="true"
                className="font-serif text-[clamp(6rem,16vw,13rem)] leading-[0.8] text-primary-dark italic"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="eyebrow text-ink-muted">{chapter.label}</p>
              <h2 className="text-h1">{chapter.value}</h2>
              {chapter.level ? (
                <p className="flex items-center gap-2 text-small text-ink-muted">
                  <span aria-hidden="true" className="flex gap-1.5">
                    {[1, 2, 3].map((dot) => (
                      <span
                        key={dot}
                        className={cn(
                          "size-3 rounded-full border border-primary-dark",
                          dot <= (chapter.level ?? 0) && "bg-primary-dark",
                        )}
                      />
                    ))}
                  </span>
                  {gauge[chapter.level]}
                </p>
              ) : null}
            </div>
            <Reveal className="relative flex min-h-72 flex-col justify-end gap-6 rounded-card border-[1.5px] border-ink bg-surface p-8 md:p-12">
              <Icon
                name={chapter.icon}
                size={144}
                className="absolute top-6 right-6 text-primary-dark/25 md:top-10 md:right-10"
              />
              <p className="max-w-md font-serif text-h3 leading-snug">{chapter.story}</p>
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  );
}
