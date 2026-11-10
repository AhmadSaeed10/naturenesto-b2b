"use client";

import { useState, useTransition } from "react";
import { addToCart } from "@/app/actions/cart";
import { Icon } from "@/components/ui/Icon";
import { commerce } from "@/content/commerce";
import { CART_EVENT } from "./CartLink";

const copy = commerce.product;

interface QuickAddProps {
  variantId: string;
  name: string;
}

/** Adds one of a single variant product from the card, with the same cart event as the page. */
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
        className="relative z-10 inline-flex size-11 items-center justify-center rounded-pill border border-ink text-ink transition-colors duration-(--duration-micro) ease-brand hover:bg-ink hover:text-background focus-visible:bg-ink focus-visible:text-background active:scale-[0.98] disabled:opacity-60"
      >
        <Icon name={state === "added" ? "check" : "bag"} size={20} />
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {state === "added" ? copy.quickAdded : state === "failed" ? copy.failed : ""}
      </span>
    </>
  );
}
