import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

export interface AccordionItem {
  id: string;
  title: string;
  content: ReactNode;
  open?: boolean;
}

interface ProductAccordionProps {
  items: AccordionItem[];
}

/** Native details elements: keyboard and screen reader behaviour come for free. */
export function ProductAccordion({ items }: ProductAccordionProps) {
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((item) => (
        <details key={item.id} open={item.open} className="group">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark [&::-webkit-details-marker]:hidden">
            {item.title}
            <Icon
              name="chevron-down"
              className="shrink-0 transition-transform duration-(--duration-micro) ease-brand group-open:rotate-180"
            />
          </summary>
          <div className="pb-5 text-ink motion-safe:animate-accordion-in">{item.content}</div>
        </details>
      ))}
    </div>
  );
}
