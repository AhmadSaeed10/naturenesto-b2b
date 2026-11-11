"use client";

import { useId, useMemo, useState } from "react";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { Button } from "@/components/ui/Button";
import { FrameCorners } from "@/components/ui/FrameCorners";
import { commerce } from "@/content/commerce";
import { shop } from "@/content/shop";
import type { Product } from "@/content/types";
import { cn } from "@/lib/utils";
import { ProductCard } from "./ProductCard";

type Light = "low" | "medium" | "bright";
type Sort = keyof typeof shop.filters.sorts;

interface ShopGridProps {
  products: Product[];
  whatsappHref: string;
}

const LIGHTS: Light[] = ["low", "medium", "bright"];
// The consultation tile sits after the fifth card, once there is enough to browse.
const TILE_AT = 5;

const CHIP =
  "inline-flex min-h-(--size-tap) items-center rounded-pill border px-4 text-small whitespace-nowrap transition-colors duration-(--duration-micro) ease-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-dark";

function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        CHIP,
        on ? "border-ink bg-ink text-background" : "border-ink/25 hover:border-ink",
      )}
    >
      {children}
    </button>
  );
}

/** Product grid with light, pet and care level filters, in stock and sort. Filters only show for facts the products have. */
export function ShopGrid({ products, whatsappHref }: ShopGridProps) {
  const uid = useId();
  const [open, setOpen] = useState(false);
  const [light, setLight] = useState<Light | null>(null);
  const [petSafe, setPetSafe] = useState(false);
  const [easy, setEasy] = useState(false);
  const [inStock, setInStock] = useState(false);
  const [sort, setSort] = useState<Sort>("featured");

  const has = useMemo(
    () => ({
      light: LIGHTS.filter((value) => products.some((p) => p.care?.light === value)),
      pet: products.some((p) => p.care?.pet === "safe"),
      easy: products.some((p) => p.care?.level === "easy"),
      stock: products.some((p) => !p.inStock),
    }),
    [products],
  );
  const canFilter = has.light.length > 0 || has.pet || has.easy || has.stock;
  const active = [light, petSafe, easy, inStock].filter(Boolean).length;

  const shown = useMemo(() => {
    const list = products.filter(
      (p) =>
        (!light || p.care?.light === light) &&
        (!petSafe || p.care?.pet === "safe") &&
        (!easy || p.care?.level === "easy") &&
        (!inStock || p.inStock),
    );
    if (sort === "price-asc") return [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") return [...list].sort((a, b) => b.price - a.price);
    if (sort === "name") return [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products, light, petSafe, easy, inStock, sort]);

  const clear = () => {
    setLight(null);
    setPetSafe(false);
    setEasy(false);
    setInStock(false);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-line py-3">
        <p className="text-small text-ink-muted" aria-live="polite">
          {shop.filters.results(shown.length)}
        </p>
        <div className="flex items-center gap-2">
          {canFilter ? (
            <button
              type="button"
              aria-expanded={open}
              aria-controls={`${uid}-panel`}
              onClick={() => setOpen(!open)}
              className={cn(CHIP, "gap-2 border-ink/25 hover:border-ink")}
            >
              {shop.filters.open(active)}
            </button>
          ) : null}
          <label className="sr-only" htmlFor={`${uid}-sort`}>
            {shop.filters.sort}
          </label>
          <select
            id={`${uid}-sort`}
            value={sort}
            onChange={(event) => setSort(event.target.value as Sort)}
            className="min-h-(--size-tap) rounded-pill border border-ink/25 bg-background px-4 text-small"
          >
            {(Object.keys(shop.filters.sorts) as Sort[]).map((key) => (
              <option key={key} value={key}>
                {shop.filters.sorts[key]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {canFilter && open ? (
        <div id={`${uid}-panel`} className="flex flex-col gap-5 rounded-card bg-surface p-5 md:p-6">
          {has.light.length > 0 ? (
            <fieldset className="flex flex-wrap items-center gap-2">
              <legend className="mb-2 w-full eyebrow text-ink-muted">{shop.filters.light}</legend>
              {has.light.map((value) => (
                <Chip
                  key={value}
                  on={light === value}
                  onClick={() => setLight(light === value ? null : value)}
                >
                  {commerce.product.care.light[value]}
                </Chip>
              ))}
            </fieldset>
          ) : null}
          {has.pet || has.easy || has.stock ? (
            <fieldset className="flex flex-wrap items-center gap-2">
              <legend className="mb-2 w-full eyebrow text-ink-muted">
                {shop.filters.pets} / {shop.filters.level}
              </legend>
              {has.pet ? (
                <Chip on={petSafe} onClick={() => setPetSafe(!petSafe)}>
                  {shop.filters.petSafe}
                </Chip>
              ) : null}
              {has.easy ? (
                <Chip on={easy} onClick={() => setEasy(!easy)}>
                  {commerce.product.care.level.easy}
                </Chip>
              ) : null}
              {has.stock ? (
                <Chip on={inStock} onClick={() => setInStock(!inStock)}>
                  {shop.filters.inStock}
                </Chip>
              ) : null}
            </fieldset>
          ) : null}
          {active > 0 ? (
            <button
              type="button"
              onClick={clear}
              className="self-start text-small text-primary-dark underline underline-offset-4"
            >
              {shop.filters.clear}
            </button>
          ) : null}
        </div>
      ) : null}

      {shown.length === 0 ? (
        <div className="flex flex-col items-start gap-4 py-8">
          <p className="text-ink-muted">{shop.filters.noMatch}</p>
          <Button type="button" variant="secondary" onClick={clear}>
            {shop.filters.clear}
          </Button>
        </div>
      ) : (
        <Stagger
          as="ul"
          key={`${light}-${petSafe}-${easy}-${inStock}-${sort}`}
          className="grid grid-cols-2 gap-x-4 gap-y-12 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6"
        >
          {shown.flatMap((product, index) => [
            ...(index === TILE_AT && shown.length > TILE_AT + 1
              ? [
                  <StaggerItem as="li" key="tile">
                    <div className="relative flex h-full min-h-80 flex-col justify-between gap-6 rounded-card bg-ink p-6 text-background">
                      <FrameCorners className="m-3 text-background/30" />
                      <h3 className="font-serif text-h3 leading-tight">{shop.tile.title}</h3>
                      <div className="flex flex-col items-start gap-4">
                        <p className="text-small">{shop.tile.body}</p>
                        <Button
                          href="/consultation"
                          variant="secondary"
                          withArrow
                          className="border-background text-background"
                        >
                          {shop.tile.cta}
                        </Button>
                      </div>
                    </div>
                  </StaggerItem>,
                ]
              : []),
            <StaggerItem as="li" key={product.id}>
              <ProductCard product={product} whatsappHref={whatsappHref} priority={index < 4} />
            </StaggerItem>,
          ])}
        </Stagger>
      )}
    </div>
  );
}
