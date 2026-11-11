import Image from "next/image";
import Link from "next/link";
import { SplitHeading } from "@/components/motion/SplitHeading";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { Icon } from "@/components/ui/Icon";
import { type SectionData, sectionFallbacks } from "@/lib/cms/sections";

const TITLE_ID = "plants-title";

interface PlantsForEveryoneProps {
  data?: SectionData<"plants">;
}

export function PlantsForEveryone({ data = sectionFallbacks.plants }: PlantsForEveryoneProps) {
  const { title: categoriesTitle, categories } = data;
  return (
    <section aria-labelledby={TITLE_ID}>
      <div className="mx-auto max-w-7xl px-4 pt-16 pb-20 md:px-8 md:pt-24 md:pb-28">
        <SplitHeading
          id={TITLE_ID}
          text={categoriesTitle}
          emphasis={["Everyone"]}
          className="mb-10 text-h2 md:mb-14"
        />
        {/* Even grid, as on thesill.com: aligned rows read cleaner than an offset spread */}
        <Stagger
          as="ul"
          className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-x-6 md:gap-y-12"
        >
          {categories.map((category, index) => (
            <StaggerItem as="li" key={category.slug}>
              <Link
                href={category.href}
                data-cursor="view"
                className="group block rounded-card focus-visible:outline-offset-4"
              >
                <span className="relative block aspect-[3/4] overflow-hidden rounded-card bg-surface">
                  <Image
                    src={category.image.src}
                    alt={category.image.alt}
                    fill
                    sizes="(min-width: 768px) 25vw, 50vw"
                    // Two rows: the first is near the fold on desktop, the rest lazy load.
                    loading={index < 4 ? "eager" : "lazy"}
                    className="object-cover transition-transform duration-(--duration-reveal) ease-brand group-hover:scale-105 group-focus-visible:scale-105"
                  />
                </span>
                <span className="mt-4 flex items-center justify-between gap-3 text-ink">
                  <span className="font-serif text-h4 transition-transform duration-(--duration-micro) ease-brand group-hover:translate-x-1 group-focus-visible:translate-x-1">
                    {category.title}
                  </span>
                  <Icon
                    name="arrow-right"
                    size={18}
                    className="shrink-0 text-primary-dark transition-transform duration-(--duration-micro) ease-brand group-hover:translate-x-1 group-focus-visible:translate-x-1"
                  />
                </span>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
