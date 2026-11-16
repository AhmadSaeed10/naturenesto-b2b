import { WishlistView } from "@/components/shop/WishlistView";
import { needHelp } from "@/content/home";
import { wishlist } from "@/content/wishlist";
import { getCatalog } from "@/lib/catalog";
import { pageMetadata } from "@/lib/seo";

export const metadata = {
  ...pageMetadata({ title: wishlist.title, description: wishlist.intro, path: "/wishlist" }),
  robots: { index: false },
};

const whatsappHref = needHelp.channels.find((channel) => channel.kind === "whatsapp")?.href ?? "";

export default async function WishlistPage() {
  const { products } = await getCatalog(null);
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
      <h1 className="mb-4 text-h1">{wishlist.title}</h1>
      <p className="mb-10 max-w-xl text-lead text-ink-muted">{wishlist.intro}</p>
      <WishlistView products={products} whatsappHref={whatsappHref} />
    </section>
  );
}
