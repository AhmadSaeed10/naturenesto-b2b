"use client";

import { useId, useMemo, useState } from "react";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { Button } from "@/components/ui/Button";
import { FrameCorners } from "@/components/ui/FrameCorners";
import { catalogCategories } from "@/content/catalog";
import { commerce } from "@/content/commerce";
import { shop } from "@/content/shop";
import type { CatalogSlug, Product } from "@/content/types";
import { cn } from "@/lib/utils";
import { ProductCard } from "./ProductCard";

type Light = "low" | "medium" | "bright";
type Sort = keyof typeof shop.filters.sorts;

interface ShopGridProps {
  products: Product[];
  whatsappHref: string;
  /** All products page: adds a category facet. */
  showCategories?: boolean;
}

const LIGHTS: Light[] = ["low", "medium", "bright"];
type Band = keyof typeof shop.filters.prices;
const BANDS: { key: Band; min: number; max: number }[] = [
  { key: "under1000", min: 0, max: 1000 },
  { key: "1000-3000", min: 1000, max: 3000 },
  { key: "3000-6000", min: 3000, max: 6000 },
  { key: "over6000", min: 6000, max: Infinity },
];
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
export function ShopGrid({ products, whatsappHref, showCategories = false }: ShopGridProps) {
  const uid = useId();
  const [open, setOpen] = useState(false);
  const [light, setLight] = useState<Light | null>(null);
  const [petSafe, setPetSafe] = useState(false);
  const [easy, setEasy] = useState(false);
  const [inStock, setInStock] = useState(false);
  const [sort, setSort] = useState<Sort>("featured");
  const [query, setQuery] = useState("");
  const [band, setBand] = useState<Band | null>(null);
  const [category, setCategory] = useState<CatalogSlug | null>(null);

  const has = useMemo(
    () => ({
      light: LIGHTS.filter((value) => products.some((p) => p.care?.light === value)),
      pet: products.some((p) => p.care?.pet === "safe"),
      easy: products.some((p) => p.care?.level === "easy"),
      stock: products.some((p) => !p.inStock),
      categories: catalogCategories.filter((c) =>
        products.some((p) => p.categories.includes(c.slug)),
      ),
    }),
    [products],
  );
  const canFilter = has.light.length > 0 || has.pet || has.easy || has.stock || products.length > 1;
  const active = [light, petSafe, easy, inStock, band, category].filter(Boolean).length;

  const needle = query.trim().toLowerCase();
  const shown = useMemo(() => {
    const list = products.filter(
      (p) =>
        (!light || p.care?.light === light) &&
        (!petSafe || p.care?.pet === "safe") &&
        (!easy || p.care?.level === "easy") &&
        (!inStock || p.inStock) &&
        (!category || p.categories.includes(category)) &&
        (!band || BANDS.some((b) => b.key === band && p.price >= b.min && p.price < b.max)) &&
        (!needle || p.name.toLowerCase().includes(needle)),
    );
    const rank = (p: Product, badge: "new" | "bestseller") => (p.badges?.includes(badge) ? 0 : 1);
    if (sort === "newest") return [...list].sort((a, b) => rank(a, "new") - rank(b, "new"));
    if (sort === "bestseller")
      return [...list].sort((a, b) => rank(a, "bestseller") - rank(b, "bestseller"));
    if (sort === "price-asc") return [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") return [...list].sort((a, b) => b.price - a.price);
    if (sort === "name") return [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products, light, petSafe, easy, inStock, sort, category, band, needle]);

  const clear = () => {
    setLight(null);
    setPetSafe(false);
    setEasy(false);
    setInStock(false);
    setBand(null);
    setCategory(null);
    setQuery("");
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-line py-3">
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
          <label className="sr-only" htmlFor={`${uid}-search`}>
            {shop.filters.search}
          </label>
          <input
            id={`${uid}-search`}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={shop.filters.searchPlaceholder}
            className="min-h-(--size-tap) w-full min-w-0 rounded-pill border border-ink/25 bg-background px-4 text-small sm:w-60"
          />
          <p className="text-small text-ink-muted" aria-live="polite">
            {shop.filters.results(shown.length)}
          </p>
        </div>
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
          {showCategories && has.categories.length > 1 ? (
            <fieldset className="flex flex-wrap items-center gap-2">
              <legend className="mb-2 w-full eyebrow text-ink-muted">
                {shop.filters.category}
              </legend>
              {has.categories.map((c) => (
                <Chip
                  key={c.slug}
                  on={category === c.slug}
                  onClick={() => setCategory(category === c.slug ? null : c.slug)}
                >
                  {c.title}
                </Chip>
              ))}
            </fieldset>
          ) : null}
          <fieldset className="flex flex-wrap items-center gap-2">
            <legend className="mb-2 w-full eyebrow text-ink-muted">{shop.filters.price}</legend>
            {BANDS.map((b) => (
              <Chip
                key={b.key}
                on={band === b.key}
                onClick={() => setBand(band === b.key ? null : b.key)}
              >
                {shop.filters.prices[b.key]}
              </Chip>
            ))}
          </fieldset>
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
          key={`${light}-${petSafe}-${easy}-${inStock}-${sort}-${category}-${band}-${needle}`}
          className="grid grid-cols-2 gap-x-4 gap-y-14 pb-12 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-6"
        >
          {shown.flatMap((product, index) => [
            ...(index === TILE_AT && shown.length > TILE_AT + 1
              ? [
                  <StaggerItem as="li" key="tile" className="min-w-0">
                    <div className="relative flex h-full min-h-80 flex-col justify-between gap-6 rounded-card bg-ink p-6 text-background">
                      <FrameCorners className="m-3 text-background/30" />
                      <h3 className="font-serif text-h3 leading-tight">{shop.tile.title}</h3>
                      <div className="flex flex-col items-start gap-4">
                        <p className="text-small">{shop.tile.body}</p>
                        <Button
                          href="/consultation"
                          variant="secondary"
                          withArrow
                          className="border-background px-4! py-2 text-center whitespace-normal! text-background"
                        >
                          {shop.tile.cta}
                        </Button>
                      </div>
                    </div>
                  </StaggerItem>,
                ]
              : []),
            <StaggerItem as="li" key={product.id} className="min-w-0">
              <ProductCard product={product} whatsappHref={whatsappHref} priority={index < 4} />
            </StaggerItem>,
          ])}
        </Stagger>
      )}
    </div>
  );
}
