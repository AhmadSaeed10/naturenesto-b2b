import type { ReactNode } from "react";
import { FrameCorners } from "@/components/ui/FrameCorners";
import { commerce } from "@/content/commerce";

const copy = commerce.product.plate;

// Riso style dot screen, printed slightly off register behind the plate.
const DOTS =
  "[background-image:radial-gradient(color-mix(in_srgb,var(--color-primary-dark)_38%,transparent)_1.3px,transparent_1.8px)] [background-size:10px_10px]";

interface SpecimenPlateProps {
  number: number;
  caption: string;
  category: string;
  children: ReactNode;
}

/** The product photo mounted like a botanical plate: header strip, brown frame, caption. */
export function SpecimenPlate({ number, caption, category, children }: SpecimenPlateProps) {
  return (
    <figure className="relative">
      <span
        aria-hidden="true"
        className={`absolute inset-0 translate-x-3 translate-y-3 rounded-card md:translate-x-4 md:translate-y-4 ${DOTS}`}
      />
      <div className="relative rounded-card border-[1.5px] border-ink bg-background p-3 md:p-4">
        <FrameCorners className="m-1.5 text-ink/60" />
        <div className="flex items-center justify-between gap-4 px-1 pb-3 eyebrow text-ink">
          <span>{copy.label(number)}</span>
          <span className="text-ink-muted">{category}</span>
        </div>
        {children}
        <figcaption className="mt-3 flex items-center gap-3 px-1 font-serif text-lead text-ink italic">
          <span aria-hidden="true" className="h-px flex-1 bg-ink/30" />
          {copy.fig(caption)}
          <span aria-hidden="true" className="h-px flex-1 bg-ink/30" />
        </figcaption>
      </div>
    </figure>
  );
}
