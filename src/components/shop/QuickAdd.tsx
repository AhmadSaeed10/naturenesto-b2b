"use client";

import { useState, useTransition } from "react";
import { addToCart } from "@/app/actions/cart";
import { Icon } from "@/components/ui/Icon";
import { commerce } from "@/content/commerce";
import { shop } from "@/content/shop";
import { cn } from "@/lib/utils";
import { CART_EVENT, openCart } from "./cart-events";

const copy = commerce.product;

interface QuickAddProps {
  variantId: string;
  name: string;
}

/**
 * Adds one of a single variant product from the card and opens the cart drawer. With a mouse it
 * is a full width bar that slides up over the photo on hover or focus; on touch it is a small
 * round button that is always there.
 */
export function QuickAdd({ variantId, name }: QuickAddProps) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<"idle" | "added" | "failed">("idle");

  function add() {
    setState("idle");
    startTransition(async () => {
      const result = await addToCart(variantId, 1);
      if (result.ok) {
        setState("added");
        window.dispatchEvent(new CustomEvent(CART_EVENT, { detail: result.count }));
        openCart();
      } else {
        setState("failed");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={add}
        disabled={pending}
        aria-label={`${copy.addToCart}: ${name}`}
        className={cn(
          "absolute right-3 bottom-3 z-10 inline-flex size-11 items-center justify-center gap-2 rounded-pill bg-background/95 text-ink shadow-soft backdrop-blur-sm transition-[transform,opacity] duration-(--duration-reveal) ease-brand active:scale-[0.98] disabled:opacity-60",
          "pointer-fine:inset-x-3 pointer-fine:size-auto pointer-fine:min-h-11 pointer-fine:translate-y-[140%] pointer-fine:bg-ink pointer-fine:px-5 pointer-fine:text-background pointer-fine:opacity-0 pointer-fine:group-focus-within:translate-y-0 pointer-fine:group-focus-within:opacity-100 pointer-fine:group-hover:translate-y-0 pointer-fine:group-hover:opacity-100",
        )}
      >
        <Icon
          name={state === "added" ? "check" : "bag"}
          size={20}
          className="pointer-fine:hidden"
        />
        <span className="hidden text-small font-medium pointer-fine:inline">
          {pending ? copy.quickAdding : state === "added" ? copy.quickAdded : shop.card.quickAdd}
        </span>
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {state === "added" ? copy.quickAdded : state === "failed" ? copy.failed : ""}
      </span>
    </>
  );
}
