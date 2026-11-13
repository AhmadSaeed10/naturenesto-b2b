import Image from "next/image";
import { Reveal } from "@/components/motion/Reveal";
import type { PageImage } from "@/content/pages-copy";
import { cn } from "@/lib/utils";

interface PhotoMosaicProps {
  images: PageImage[];
}

// Five frames in an asymmetric grid; one tall, one wide. Fewer images simply fill the first cells.
const CELLS = [
  "col-span-2 row-span-2 aspect-square md:col-span-2 md:aspect-auto",
  "aspect-[4/5]",
  "aspect-[4/5]",
  "aspect-[4/5]",
  "col-span-2 aspect-[2/1] md:col-span-1 md:aspect-[4/5]",
];

export function PhotoMosaic({ images }: PhotoMosaicProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 md:px-8 md:pb-24">
      <Reveal className="grid grid-cols-2 gap-3 md:grid-cols-4 md:grid-rows-2 md:gap-4">
        {images.slice(0, CELLS.length).map((image, index) => (
          <div
            key={image.src}
            className={cn("relative min-h-0 overflow-hidden rounded-card bg-surface", CELLS[index])}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(min-width: 768px) 25vw, 50vw"
              className="object-cover"
            />
          </div>
        ))}
      </Reveal>
    </section>
  );
}
