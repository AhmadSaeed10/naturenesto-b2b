import Link from "next/link";
import { Eyebrow } from "@/components/ui/Eyebrow";

interface TopicChipsProps {
  eyebrow?: string;
  topics: { label: string; href: string }[];
}

export function TopicChips({ eyebrow, topics }: TopicChipsProps) {
  return (
    <nav aria-label={eyebrow} className="mx-auto flex max-w-7xl flex-col gap-4 px-4 pb-10 md:px-8">
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <ul className="flex flex-wrap gap-2">
        {topics.map((topic) => (
          <li key={topic.label}>
            <Link
              href={topic.href}
              className="inline-flex min-h-(--size-tap) items-center rounded-pill border border-ink/25 px-4 text-small text-ink transition-colors duration-(--duration-micro) ease-brand hover:border-ink"
            >
              {topic.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
