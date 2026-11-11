import { cn } from "@/lib/utils";

interface StarsProps {
  /** 0 to 5, fractions allowed (shown as a partly filled star). */
  value: number;
  size?: number;
  className?: string;
}

const PATH = "m12 2.8 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.7l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9z";

/** Decorative stars; the number next to them carries the meaning, so they are hidden from AT. */
export function Stars({ value, size = 16, className }: StarsProps) {
  return (
    <span aria-hidden="true" className={cn("inline-flex gap-0.5 text-primary-dark", className)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = Math.max(0, Math.min(1, value - (n - 1)));
        return (
          <svg key={n} width={size} height={size} viewBox="0 0 24 24" className="shrink-0">
            <defs>
              <clipPath id={`star-${n}-${Math.round(fill * 100)}`}>
                <rect width={24 * fill} height="24" />
              </clipPath>
            </defs>
            <path
              d={PATH}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path
              d={PATH}
              fill="currentColor"
              clipPath={`url(#star-${n}-${Math.round(fill * 100)})`}
            />
          </svg>
        );
      })}
    </span>
  );
}
