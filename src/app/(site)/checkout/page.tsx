import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutForm } from "@/components/shop/CheckoutForm";
import { Button } from "@/components/ui/Button";
import { commerce } from "@/content/commerce";
import { backToCart } from "@/app/actions/cart";
import { hasPreviousCart, quoteCart } from "@/lib/commerce/cart";
import { checkoutDefaults, enabledPaymentMethods } from "@/lib/commerce/checkout-data";

export const metadata: Metadata = { title: commerce.checkout.title, robots: { index: false } };

async function Checkout() {
  const defaults = await checkoutDefaults();
  const [quote, methods] = await Promise.all([
    quoteCart({ city: defaults.city, email: defaults.email }),
    enabledPaymentMethods(),
  ]);
  if (!quote || quote.lines.length === 0) {
    return (
      <div className="flex flex-col items-start gap-6">
        <p className="text-lead text-ink-muted">{commerce.checkout.emptyCart}</p>
        <Button href="/indoor-plants" withArrow>
          {commerce.cart.browse}
        </Button>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-8">
      {(await hasPreviousCart()) ? (
        <form
          action={backToCart}
          className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-card border border-dashed border-ink/40 px-5 py-3 text-small"
        >
          <p>{commerce.cart.buyOnly}</p>
          <button
            type="submit"
            className="inline-flex min-h-(--size-tap) items-center text-primary-dark underline underline-offset-4"
          >
            {commerce.cart.buyOnlyBack}
          </button>
        </form>
      ) : null}
      <CheckoutForm initialQuote={quote} methods={methods} defaults={defaults} />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <section className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-16 md:px-8 md:py-24">
      <h1 className="text-h1">{commerce.checkout.title}</h1>
      <Suspense>
        <Checkout />
      </Suspense>
    </section>
  );
}
