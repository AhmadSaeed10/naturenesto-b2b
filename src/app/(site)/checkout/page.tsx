import type { Metadata } from "next";
import { CheckoutForm } from "@/components/shop/CheckoutForm";
import { commerce } from "@/content/commerce";
import { getCartCatalog } from "@/lib/catalog";
import { getDeliveryRates } from "@/lib/cms/data";

export const metadata: Metadata = { title: commerce.checkout.title, robots: { index: false } };

const BROWSE_HREF = "/indoor-plants";

export default async function CheckoutPage() {
  const [catalog, rates] = await Promise.all([getCartCatalog(), getDeliveryRates()]);
  return (
    <section className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-16 md:px-8 md:py-24">
      <h1 className="text-h1">{commerce.checkout.title}</h1>
      <CheckoutForm catalog={catalog} rates={rates} browseHref={BROWSE_HREF} />
    </section>
  );
}
