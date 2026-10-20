import type { Metadata } from "next";
import { CartView } from "@/components/shop/CartView";
import { commerce } from "@/content/commerce";
import { getCartCatalog } from "@/lib/catalog";

export const metadata: Metadata = { title: commerce.cart.title, robots: { index: false } };

const BROWSE_HREF = "/indoor-plants";

export default async function CartPage() {
  const catalog = await getCartCatalog();
  return (
    <section className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-16 md:px-8 md:py-24">
      <h1 className="text-h1">{commerce.cart.title}</h1>
      <CartView catalog={catalog} browseHref={BROWSE_HREF} />
    </section>
  );
}
