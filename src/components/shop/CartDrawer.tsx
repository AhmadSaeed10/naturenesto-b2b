"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { type DrawerCart, readCart, setCartQuantity } from "@/app/actions/cart";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { commerce } from "@/content/commerce";
import { formatPaisa } from "@/lib/money";
import { cn } from "@/lib/utils";
import { CART_EVENT, CART_OPEN_EVENT } from "./cart-events";

const copy = commerce.cart;
const CLOSE_MS = 280;
const STEP =
  "inline-flex size-9 items-center justify-center text-ink hover:bg-surface focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-dark disabled:text-ink-muted disabled:hover:bg-transparent";

/**
 * Slide-in cart. A native dialog gives the focus trap, Escape and inert page for free; the
 * slide is a transform so it stays cheap. It opens on the open event (add to cart, header bag).
 */
export function CartDrawer() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [shown, setShown] = useState(false);
  const [cart, setCart] = useState<DrawerCart | null>(null);
  const [pending, startTransition] = useTransition();
  const closing = useRef<number | undefined>(undefined);

  const load = useCallback(() => {
    startTransition(async () => {
      const next = await readCart();
      setCart(next);
      window.dispatchEvent(new CustomEvent(CART_EVENT, { detail: next.count }));
    });
  }, []);

  const open = useCallback(() => {
    window.clearTimeout(closing.current);
    const el = dialog.current;
    if (!el) return;
    if (!el.open) el.showModal();
    // Next frame, so the transition runs from the off screen position.
    requestAnimationFrame(() => setShown(true));
    load();
  }, [load]);

  const close = useCallback(() => {
    setShown(false);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    closing.current = window.setTimeout(() => dialog.current?.close(), reduced ? 0 : CLOSE_MS);
  }, []);

  useEffect(() => {
    window.addEventListener(CART_OPEN_EVENT, open);
    return () => window.removeEventListener(CART_OPEN_EVENT, open);
  }, [open]);

  const change = (variantId: string, quantity: number) =>
    startTransition(async () => {
      await setCartQuantity(variantId, quantity);
      const next = await readCart();
      setCart(next);
      window.dispatchEvent(new CustomEvent(CART_EVENT, { detail: next.count }));
    });

  return (
    <dialog
      ref={dialog}
      aria-label={copy.drawer.title}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target === dialog.current) close();
      }}
      className="m-0 ml-auto h-dvh max-h-dvh w-full max-w-md bg-transparent p-0 backdrop:bg-ink/40 backdrop:backdrop-blur-[2px]"
    >
      <div
        className={cn(
          "flex h-full flex-col bg-background text-ink shadow-2xl transition-transform duration-(--duration-reveal) ease-brand motion-reduce:transition-none",
          shown ? "translate-x-0" : "translate-x-full",
        )}
      >
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-serif text-h4">{copy.drawer.title}</h2>
          <button
            type="button"
            onClick={close}
            className="inline-flex size-(--size-tap) items-center justify-center rounded-pill hover:bg-surface"
          >
            <Icon name="close" size={22} />
            <span className="sr-only">{copy.drawer.close}</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5" aria-busy={pending}>
          {cart === null ? (
            <p role="status" className="py-8 text-ink-muted">
              {copy.drawer.loading}
            </p>
          ) : cart.lines.length === 0 ? (
            <div className="flex flex-col items-start gap-5 py-8">
              <p className="text-ink-muted">{copy.drawer.empty}</p>
              <Button href="/indoor-plants" variant="secondary" withArrow onClick={close}>
                {copy.browse}
              </Button>
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-line">
              {cart.lines.map((line) => (
                <li
                  key={line.variantId}
                  className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-4 py-5"
                >
                  <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-surface">
                    {line.image ? (
                      <Image src={line.image} alt="" fill sizes="72px" className="object-cover" />
                    ) : null}
                  </div>
                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex items-start justify-between gap-3">
                      <Link
                        href={`/products/${line.handle}`}
                        onClick={close}
                        className="font-serif text-lead leading-tight underline-offset-4 hover:underline"
                      >
                        {line.title}
                      </Link>
                      <span className="shrink-0 font-medium">{formatPaisa(line.lineTotal)}</span>
                    </div>
                    {line.variantTitle !== "Default" ? (
                      <p className="text-small text-ink-muted">{line.variantTitle}</p>
                    ) : null}
                    {!line.available ? (
                      <p role="alert" className="text-small font-medium">
                        {copy.unavailable}
                      </p>
                    ) : null}
                    <div className="mt-1 flex items-center gap-4">
                      <div
                        role="group"
                        aria-label={copy.quantity(line.title)}
                        className="inline-flex items-center rounded-pill border border-ink-muted"
                      >
                        <button
                          type="button"
                          className={cn(STEP, "rounded-l-pill")}
                          disabled={pending}
                          aria-label={copy.drawer.decrease(line.title)}
                          onClick={() => change(line.variantId, line.quantity - 1)}
                        >
                          <Icon name="minus" size={16} />
                        </button>
                        <span className="min-w-8 text-center text-small" aria-live="polite">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          className={cn(STEP, "rounded-r-pill")}
                          disabled={pending || line.quantity >= line.max}
                          aria-label={copy.drawer.increase(line.title)}
                          onClick={() => change(line.variantId, line.quantity + 1)}
                        >
                          <Icon name="plus" size={16} />
                        </button>
                      </div>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => change(line.variantId, 0)}
                        className="text-small text-primary-dark underline underline-offset-4"
                      >
                        {copy.remove}
                        <span className="sr-only">: {line.title}</span>
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {cart && cart.lines.length > 0 ? (
          <footer className="flex flex-col gap-3 border-t border-line px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <p className="flex justify-between text-lead">
              <span>{copy.subtotal}</span>
              <span className="font-medium">{formatPaisa(cart.subtotal)}</span>
            </p>
            <p className="text-small text-ink-muted">{copy.shippingNote}</p>
            {cart.blocked ? (
              <p className="text-small font-medium">{commerce.checkout.errors.unavailable}</p>
            ) : (
              <Button href="/checkout" withArrow className="w-full" onClick={close}>
                {copy.checkout}
              </Button>
            )}
            <Link
              href="/cart"
              onClick={close}
              className="inline-flex min-h-(--size-tap) items-center justify-center text-small underline underline-offset-4"
            >
              {copy.drawer.viewCart}
            </Link>
          </footer>
        ) : null}
      </div>
    </dialog>
  );
}
