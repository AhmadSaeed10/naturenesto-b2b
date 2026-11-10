import { Icon, type UiIconName } from "@/components/ui/Icon";
import { commerce } from "@/content/commerce";
import { type Care, hasCare } from "@/lib/care";

const copy = commerce.product.care;

interface Fact {
  key: string;
  icon: UiIconName;
  label: string;
  value: string;
}

function facts(care: Care): Fact[] {
  const list: Fact[] = [];
  if (care.light) {
    list.push({
      key: "light",
      icon: "sun",
      label: copy.light.label,
      value: copy.light[care.light],
    });
  }
  if (care.water) {
    list.push({
      key: "water",
      icon: "drop",
      label: copy.water.label,
      value: copy.water[care.water],
    });
  }
  if (care.pet) {
    list.push({ key: "pet", icon: "paw", label: copy.pet.label, value: copy.pet[care.pet] });
  }
  if (care.level) {
    list.push({
      key: "level",
      icon: "gauge",
      label: copy.level.label,
      value: copy.level[care.level],
    });
  }
  if (care.size) {
    list.push({ key: "size", icon: "ruler", label: copy.size.label, value: care.size });
  }
  return list;
}

interface CareGridProps {
  care: Care;
}

/** Icon tiles for the care facts that are set; renders nothing when none are. */
export function CareGrid({ care }: CareGridProps) {
  if (!hasCare(care)) return null;
  const items = facts(care);
  if (items.length === 0) return null;
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((fact) => (
        <div
          key={fact.key}
          className="flex flex-col gap-3 rounded-card border border-line bg-background p-4 md:p-5"
        >
          <Icon name={fact.icon} size={26} className="text-primary-dark" />
          <div>
            <dt className="eyebrow text-ink-muted">{fact.label}</dt>
            <dd className="mt-1 font-medium text-ink">{fact.value}</dd>
          </div>
        </div>
      ))}
    </dl>
  );
}
