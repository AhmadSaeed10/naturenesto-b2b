"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import { addToCart, buyNow } from "@/app/actions/cart";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { commerce } from "@/content/commerce";
import { shop } from "@/content/shop";
import type { StoreProduct } from "@/lib/commerce/products";
import type { PairingPot } from "@/lib/commerce/related";
import Image from "next/image";
import { formatPaisa } from "@/lib/money";
import { cn } from "@/lib/utils";
import { CART_EVENT, VARIANT_IMAGE_EVENT, openCart } from "./cart-events";

const copy = commerce.product;
const MAX_QUANTITY = 99;

interface ProductPurchaseProps {
  product: Pick<StoreProduct, "title" | "options" | "variants" | "source">;
  whatsappHref: string;
  /** Pots offered beside a plant; picking one adds it with the plant. */
  pots?: PairingPot[];
  /** First product photo, for the mobile sticky bar. */
  image?: { src: string; alt: string };
}

const CHOICE =
  "flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 text-center text-small transition-colors duration-(--duration-micro) ease-brand has-focus-visible:outline-2 has-focus-visible:outline-offset-3 has-focus-visible:outline-primary-dark";
const CHOICE_ON = "border-ink bg-surface font-medium text-ink";
const CHOICE_OFF = "border-line text-ink hover:border-ink-muted";

const STEP_BUTTON =
  "inline-flex size-11 items-center justify-center text-ink transition-colors duration-(--duration-micro) ease-brand hover:bg-surface focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-dark disabled:text-ink-muted disabled:hover:bg-transparent";

export function ProductPurchase({ product, whatsappHref, pots = [], image }: ProductPurchaseProps) {
  const uid = useId();
  const readOnly = product.source === "sample";
  const first = product.variants.find((v) => v.available) ?? product.variants[0];
  const [selected, setSelected] = useState<Record<string, string>>(first?.optionValues ?? {});
  const [quantity, setQuantity] = useState(1);
  const [pot, setPot] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [added, setAdded] = useState(false);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const cta = useRef<HTMLDivElement>(null);
  const [barVisible, setBarVisible] = useState(false);

  const variant = useMemo(
    () =>
      product.options.length === 0
        ? product.variants[0]
        : product.variants.find((v) =>
            product.options.every((o) => v.optionValues[o.name] === selected[o.name]),
          ),
    [product, selected],
  );

  // Tell the gallery to show the photo of the picked variant. Skipped on first render so the
  // page opens on the main photo.
  const firstRender = useRef(true);
  const variantImage = variant?.imageSrc ?? null;
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (variantImage)
      window.dispatchEvent(new CustomEvent(VARIANT_IMAGE_EVENT, { detail: variantImage }));
  }, [variantImage]);

  const maxQuantity = variant?.lowStock ?? MAX_QUANTITY;
  const canBuy = Boolean(variant?.available) && !readOnly;
  const saving =
    variant?.compareAtPrice && variant.compareAtPrice > variant.price
      ? variant.compareAtPrice - variant.price
      : 0;

  // The mobile bar appears once the main button has scrolled out above the viewport.
  useEffect(() => {
    const el = cta.current;
    if (!el || !canBuy) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry) setBarVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [canBuy]);

  function add() {
    if (!variant) return;
    setMessage("");
    setAdded(false);
    startTransition(async () => {
      let result = await addToCart(variant.id, quantity);
      if (result.ok && pot) result = await addToCart(pot, 1);
      if (result.ok) {
        setAdded(true);
        setMessage(copy.added);
        window.dispatchEvent(new CustomEvent(CART_EVENT, { detail: result.count }));
        openCart();
      } else {
        setMessage(result.error === "unavailable" ? copy.outOfStock : copy.failed);
      }
    });
  }

  function buy() {
    if (!variant) return;
    setMessage("");
    setAdded(false);
    startTransition(async () => {
      const result = await buyNow(variant.id, quantity, pot ? [pot] : []);
      if (result.ok) {
        router.push("/checkout");
      } else {
        setMessage(result.error === "unavailable" ? copy.outOfStock : copy.failed);
      }
    });
  }

  const label =
    variant && variant.title !== "Default" ? `${product.title} (${variant.title})` : product.title;
  const enquiry = `${whatsappHref}?text=${encodeURIComponent(
    shop.whatsappMessage(label, variant ? formatPaisa(variant.price) : ""),
  )}`;
  const chosenPot = pots.find((entry) => entry.variantId === pot);
  const total = variant ? variant.price * quantity + (chosenPot ? chosenPot.price * 100 : 0) : 0;
  const buttonLabel = pending
    ? copy.adding
    : chosenPot
      ? `${copy.addToCart} · ${formatPaisa(total)}`
      : variant
        ? `${copy.addToCart} · ${formatPaisa(total)}`
        : copy.addToCart;

  return (
    <div className="flex flex-col gap-6">
      {variant ? (
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-sans text-h4 font-medium">{formatPaisa(variant.price)}</span>
          {saving ? (
            <>
              <s className="text-lead text-ink-muted">{formatPaisa(variant.compareAtPrice ?? 0)}</s>
              <span className="rounded-pill bg-primary-dark px-3 py-1 text-small font-medium text-background">
                {copy.save(formatPaisa(saving))}
              </span>
            </>
          ) : null}
        </p>
      ) : (
        <p className="text-ink">{copy.unavailable}</p>
      )}

      {variant?.available && !readOnly ? (
        <p className="flex flex-wrap items-center gap-x-2 text-small">
          <Icon name="check" size={16} className="text-primary-dark" />
          <span className="font-medium">{copy.inStockLine}</span>
          <span className="text-ink-muted">{copy.stockNote}</span>
        </p>
      ) : null}

      {product.options.map((option) => (
        <fieldset key={option.name} className="flex flex-col gap-3">
          <legend className="mb-3 text-small">
            <span className="font-medium">{copy.pick(option.name)}</span>
            {selected[option.name] ? (
              <span className="font-serif text-base text-ink-muted italic">
                {" "}
                {selected[option.name]}
              </span>
            ) : null}
          </legend>
          <div className="grid grid-cols-3 gap-3">
            {option.values.map((value) => {
              const id = `${uid}-${option.name}-${value}`;
              const checked = selected[option.name] === value;
              return (
                <label
                  key={value}
                  htmlFor={id}
                  className={cn(CHOICE, checked ? CHOICE_ON : CHOICE_OFF)}
                >
                  <input
                    id={id}
                    type="radio"
                    name={`${uid}-${option.name}`}
                    value={value}
                    checked={checked}
                    onChange={() =>
                      setSelected((current) => ({ ...current, [option.name]: value }))
                    }
                    className="sr-only"
                  />
                  {value}
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}

      {variant?.lowStock ? (
        <p className="text-small font-medium text-ink">{copy.lowStock(variant.lowStock)}</p>
      ) : null}

      {readOnly ? (
        <div className="flex flex-col gap-4">
          <p className="rounded-card border border-dashed border-ink/30 px-4 py-3 text-small text-ink">
            {copy.sample}
          </p>
          {variant?.available ? (
            <Button
              href={enquiry}
              target="_blank"
              rel="noopener noreferrer"
              withArrow
              className="w-full sm:w-auto"
            >
              {copy.enquire}
            </Button>
          ) : (
            <p className="font-medium text-ink-muted">{copy.outOfStock}</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {canBuy && pots.length > 0 ? (
            <fieldset className="flex flex-col gap-3">
              <legend className="mb-3 text-small">
                <span className="font-medium">{copy.pairing.title}:</span>
                <span className="font-serif text-base text-ink-muted italic">
                  {" "}
                  {chosenPot ? chosenPot.name : copy.pairing.none}
                </span>
              </legend>
              <ul className="grid grid-cols-3 gap-3">
                {pots.slice(0, 3).map((entry) => {
                  const on = pot === entry.variantId;
                  return (
                    <li key={entry.variantId}>
                      <button
                        type="button"
                        aria-pressed={on}
                        onClick={() => setPot(on ? null : entry.variantId)}
                        className={cn(
                          CHOICE,
                          "w-full flex-col py-2 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary-dark",
                          on ? CHOICE_ON : CHOICE_OFF,
                        )}
                      >
                        <span className="relative size-10 overflow-hidden rounded-lg bg-surface">
                          <Image
                            src={entry.image}
                            alt=""
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </span>
                        <span className="line-clamp-1 text-[0.8125rem]">{entry.name}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          ) : null}

          {canBuy ? (
            <>
              <div ref={cta} className="flex items-stretch gap-3">
                <div
                  role="group"
                  aria-label={copy.quantity}
                  className="inline-flex shrink-0 items-center rounded-pill border border-line"
                >
                  <button
                    type="button"
                    aria-label={copy.decrease}
                    disabled={quantity <= 1}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className={cn(STEP_BUTTON, "rounded-l-pill")}
                  >
                    <Icon name="minus" size={18} />
                  </button>
                  <input
                    id={`${uid}-qty`}
                    type="number"
                    inputMode="numeric"
                    aria-label={copy.quantity}
                    min={1}
                    max={maxQuantity}
                    value={quantity}
                    onChange={(event) =>
                      setQuantity(
                        Math.max(1, Math.min(maxQuantity, Number(event.target.value) || 1)),
                      )
                    }
                    className="h-11 w-10 [appearance:textfield] bg-transparent text-center focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-dark [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    aria-label={copy.increase}
                    disabled={quantity >= maxQuantity}
                    onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                    className={cn(STEP_BUTTON, "rounded-r-pill")}
                  >
                    <Icon name="plus" size={18} />
                  </button>
                </div>
                <Button type="button" onClick={add} disabled={pending} withArrow className="flex-1">
                  {buttonLabel}
                </Button>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={buy}
                disabled={pending}
                className="w-full"
              >
                {copy.buyNow}
              </Button>
              <p className="text-small text-ink-muted">{copy.shipLine}</p>
            </>
          ) : (
            <p className="inline-flex min-h-(--size-tap) items-center font-medium text-ink-muted">
              {copy.outOfStock}
            </p>
          )}
          <div
            role="status"
            aria-live="polite"
            className="flex flex-wrap items-center gap-3 text-small empty:-mt-3"
          >
            {added ? <Icon name="check" size={18} className="text-primary-dark" /> : null}
            {message}
            {added ? (
              <Link href="/cart" className="text-primary-dark underline underline-offset-4">
                {copy.viewCart}
              </Link>
            ) : null}
          </div>
          <div>
            <Button href={enquiry} target="_blank" rel="noopener noreferrer" variant="link">
              {copy.enquire}
            </Button>
          </div>
        </div>
      )}

      {/* Mobile only: keeps the buy action in reach once the main button has scrolled away. */}
      {canBuy ? (
        <div
          inert={!barVisible}
          aria-hidden={!barVisible}
          className={cn(
            "fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-line bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur transition-transform duration-(--duration-reveal) ease-brand lg:hidden",
            barVisible ? "translate-y-0" : "translate-y-full",
          )}
        >
          {image ? (
            <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-surface">
              <Image src={image.src} alt="" fill sizes="48px" className="object-cover" />
            </span>
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="truncate text-small font-medium">{product.title}</p>
            {variant ? (
              <p className="text-small text-ink-muted">{formatPaisa(variant.price)}</p>
            ) : null}
          </div>
          <Button type="button" onClick={add} disabled={pending} className="shrink-0 px-4">
            {added && !pending ? copy.added_short : buttonLabel}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={buy}
            disabled={pending}
            className="shrink-0 px-4"
          >
            {copy.buyNow}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
