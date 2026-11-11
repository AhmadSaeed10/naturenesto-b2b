import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Icon, type UiIconName } from "@/components/ui/Icon";
import { commerce } from "@/content/commerce";
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

const care = commerce.product.care;

/** At most three care icons: light, pets, care level. Each carries a readable label. */
function careIcons(product: Product): { icon: UiIconName; label: string }[] {
  const facts = product.care;
  if (!facts) return [];
  const list: { icon: UiIconName; label: string }[] = [];
  if (facts.light) list.push({ icon: "sun", label: care.light[facts.light] });
  if (facts.pet) list.push({ icon: "paw", label: care.pet[facts.pet] });
  if (facts.level) list.push({ icon: "gauge", label: care.level[facts.level] });
  return list.slice(0, 3);
}

export function ProductCard({ product, whatsappHref, priority = false }: ProductCardProps) {
  const price = formatPrice(product.price);
  const enquiry = `${whatsappHref}?text=${encodeURIComponent(shop.whatsappMessage(product.name, price))}`;
  const icons = careIcons(product);
  const badge = product.badges?.find((b) => b === "new" || b === "bestseller");

  return (
    <article className="group relative flex h-full flex-col">
      <div className="relative aspect-[4/5] overflow-hidden rounded-card bg-surface">
        <Image
          src={product.image.src}
          alt={product.image.alt}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          priority={priority}
          className={cn(
            "object-cover mix-blend-multiply transition-[transform,opacity] duration-(--duration-reveal) ease-brand group-hover:scale-[1.04]",
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

        {badge || !product.inStock ? (
          <p className="absolute top-3 left-3 rounded-pill bg-background px-3 py-1 eyebrow text-ink">
            {product.inStock && badge ? shop.badges[badge] : shop.card.soldOut}
          </p>
        ) : null}

        {icons.length > 0 ? (
          <ul
            aria-label={shop.card.careIcons}
            className="absolute bottom-3 left-3 flex gap-1.5 transition-opacity duration-(--duration-micro) ease-brand pointer-fine:group-focus-within:opacity-0 pointer-fine:group-hover:opacity-0 max-sm:[&>li:nth-child(3)]:hidden"
          >
            {icons.map(({ icon, label }) => (
              <li
                key={icon}
                className="inline-flex size-7 items-center justify-center rounded-pill bg-background/95 text-primary-dark sm:size-8"
              >
                <Icon name={icon} size={16} />
                <span className="sr-only">{label}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {product.quickAddVariantId && product.inStock ? (
          <QuickAdd variantId={product.quickAddVariantId} name={product.name} />
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-1 pt-4">
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
        {product.size ? <p className="text-small text-ink-muted">{product.size}</p> : null}
        <p className="mt-1 flex flex-wrap items-baseline gap-x-2 text-ink">
          {product.fromPrice ? (
            <span className="text-small text-ink-muted">{shop.card.from}</span>
          ) : null}
          <span className="font-medium">{price}</span>
          {product.compareAtPrice ? (
            <s className="text-small text-ink-muted">{formatPrice(product.compareAtPrice)}</s>
          ) : null}
        </p>
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
