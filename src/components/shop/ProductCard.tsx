import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { FrameCorners } from "@/components/ui/FrameCorners";
import { shop } from "@/content/shop";
import type { Product } from "@/content/types";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { QuickAdd } from "./QuickAdd";

interface ProductCardProps {
  product: Product;
  /** wa.me base link; used only for products that have no page. */
  whatsappHref: string;
  priority?: boolean;
}

/** Up to three care words for the printed line under the name: light, pets, care level. */
function careLine(product: Product): string[] {
  const facts = product.care;
  if (!facts) return [];
  return [
    facts.light ? shop.card.careShort.light[facts.light] : "",
    facts.pet ? shop.card.careShort.pet[facts.pet] : "",
    facts.level ? shop.card.careShort.level[facts.level] : "",
  ].filter(Boolean);
}

// Riso dot screen that prints just off register behind the photo on hover.
const DOTS =
  "[background-image:radial-gradient(color-mix(in_srgb,var(--color-primary-dark)_45%,transparent)_1.3px,transparent_1.8px)] [background-size:9px_9px]";

export function ProductCard({ product, whatsappHref, priority = false }: ProductCardProps) {
  const price = formatPrice(product.price);
  const enquiry = `${whatsappHref}?text=${encodeURIComponent(shop.whatsappMessage(product.name, price))}`;
  const line = careLine(product);
  const badge = product.badges?.find((b) => b === "new" || b === "bestseller");
  // One printed tag at most: sold out beats sale beats the badge.
  const tag = !product.inStock
    ? shop.card.soldOut
    : product.compareAtPrice
      ? shop.card.sale
      : badge
        ? shop.badges[badge]
        : null;

  return (
    <article className="group relative flex h-full flex-col">
      <div className="relative">
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-0 translate-x-0 translate-y-0 rounded-card opacity-0 transition-[transform,opacity] duration-(--duration-reveal) ease-brand group-hover:translate-x-2.5 group-hover:translate-y-2.5 group-hover:opacity-100",
            DOTS,
          )}
        />
        {/* The photo is mounted like a postage stamp, the same edge as the homepage drawing. */}
        <div className="relative bg-surface stamp">
          <div className="relative aspect-[3/4] overflow-hidden bg-surface">
            <Image
              src={product.image.src}
              alt={product.image.alt}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              priority={priority}
              className={cn(
                "object-cover mix-blend-multiply transition-[transform,opacity] duration-(--duration-reveal) ease-brand group-hover:scale-[1.05]",
                product.hoverImage && "pointer-fine:group-hover:opacity-0",
                !product.inStock && "opacity-60 grayscale",
              )}
            />
            {product.hoverImage ? (
              // Second angle on hover for mouse users; the card link already names the product.
              <Image
                src={product.hoverImage.src}
                alt=""
                fill
                sizes="(min-width: 1024px) 25vw, 33vw"
                className="hidden object-cover opacity-0 mix-blend-multiply transition-opacity duration-(--duration-reveal) ease-brand group-hover:opacity-100 pointer-fine:block"
              />
            ) : null}

            {tag ? (
              <p className="absolute top-4 left-4 -rotate-6 rounded-[6px] border-[1.5px] border-primary-dark bg-background/80 px-2.5 py-1 eyebrow text-primary-dark">
                {tag}
              </p>
            ) : null}

            {product.quickAddVariantId && product.inStock ? (
              <QuickAdd variantId={product.quickAddVariantId} name={product.name} />
            ) : null}
          </div>
        </div>
        <FrameCorners className="-m-2 text-ink opacity-0 transition-opacity duration-(--duration-micro) ease-brand group-focus-within:opacity-100 group-hover:opacity-100" />
      </div>

      <div className="flex flex-1 flex-col gap-1 pt-5">
        <div className="flex items-baseline justify-between gap-3 border-t-[1.5px] border-ink pt-3">
          <h3 className="font-serif text-h4 leading-tight text-ink">
            {product.href ? (
              // The whole card is clickable through this link's stretched hit area.
              <Link href={product.href} className="after:absolute after:inset-0 after:content-['']">
                {product.name}
              </Link>
            ) : (
              product.name
            )}
          </h3>
          <p className="flex shrink-0 flex-col items-end text-ink">
            <span className="font-medium">
              {product.fromPrice ? (
                <span className="mr-1 text-small font-normal text-ink-muted">{shop.card.from}</span>
              ) : null}
              {price}
            </span>
            {product.compareAtPrice ? (
              <s className="text-small text-ink-muted">{formatPrice(product.compareAtPrice)}</s>
            ) : null}
          </p>
        </div>
        {product.size ? <p className="text-small text-ink-muted">{product.size}</p> : null}
        {line.length > 0 ? <p className="mt-2 eyebrow text-ink-muted">{line.join(" · ")}</p> : null}
        {product.lowStock && product.inStock ? (
          <p className="text-small font-medium text-primary-dark">
            {shop.card.onlyLeft(product.lowStock)}
          </p>
        ) : null}
        {!product.href && product.inStock ? (
          <div className="pt-3">
            <Button
              href={enquiry}
              target="_blank"
              rel="noopener noreferrer"
              variant="secondary"
              withArrow
              aria-label={`${shop.enquire}: ${product.name}`}
            >
              {shop.enquire}
            </Button>
          </div>
        ) : null}
      </div>
    </article>
  );
}
