import { Icon, type UiIconName } from "@/components/ui/Icon";
import { commerce } from "@/content/commerce";
import { type Care, hasCare } from "@/lib/care";
import { cn } from "@/lib/utils";

const copy = commerce.product.care;
const plate = commerce.product.plate;

interface Row {
  key: string;
  icon: UiIconName;
  label: string;
  value: string;
  /** 1 to 3 for rows drawn as a gauge. */
  level?: 1 | 2 | 3;
}

const LEVELS = {
  low: 1,
  medium: 2,
  bright: 3,
  moderate: 2,
  frequent: 3,
  easy: 1,
  expert: 3,
} as const;

function rows(care: Care): Row[] {
  const list: Row[] = [];
  if (care.light) {
    list.push({
      key: "light",
      icon: "sun",
      label: copy.light.label,
      value: copy.light[care.light],
      level: LEVELS[care.light],
    });
  }
  if (care.water) {
    list.push({
      key: "water",
      icon: "drop",
      label: copy.water.label,
      value: copy.water[care.water],
      level: LEVELS[care.water],
    });
  }
  if (care.level) {
    list.push({
      key: "level",
      icon: "gauge",
      label: copy.level.label,
      value: copy.level[care.level],
      level: LEVELS[care.level],
    });
  }
  if (care.pet)
    list.push({ key: "pet", icon: "paw", label: copy.pet.label, value: copy.pet[care.pet] });
  if (care.size)
    list.push({ key: "size", icon: "ruler", label: copy.size.label, value: care.size });
  return list;
}

/**
 * The care facts drawn as a herbarium chart: numbered rows, dotted leaders and a three dot gauge
 * where the value is a scale. Nothing renders when no care data is set.
 */
export function CareChart({ care }: { care: Care }) {
  if (!hasCare(care)) return null;
  const items = rows(care);
  if (items.length === 0) return null;
  return (
    <dl className="border-y-[1.5px] border-ink">
      {items.map((row, index) => (
        <div
          key={row.key}
          className="grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-x-3 border-b border-dashed border-ink/30 py-4 last:border-b-0"
        >
          <span aria-hidden="true" className="font-serif text-h4 text-ink-muted italic">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="flex min-w-0 items-center gap-3">
            <Icon name={row.icon} size={22} className="shrink-0 text-primary-dark" />
            <div>
              <dt className="eyebrow text-ink-muted">{row.label}</dt>
              <dd className="font-serif text-lead text-ink">{row.value}</dd>
            </div>
          </div>
          {row.level ? (
            <span aria-hidden="true" className="flex gap-1.5" title={plate.gauge[row.level]}>
              {[1, 2, 3].map((dot) => (
                <span
                  key={dot}
                  className={cn(
                    "size-3 rounded-full border border-primary-dark",
                    dot <= (row.level ?? 0) ? "bg-primary-dark" : "bg-transparent",
                  )}
                />
              ))}
            </span>
          ) : null}
        </div>
      ))}
    </dl>
  );
}
