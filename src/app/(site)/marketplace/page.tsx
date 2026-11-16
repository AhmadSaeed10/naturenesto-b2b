import { CtaBand } from "@/components/pages/CtaBand";
import { PageHero } from "@/components/pages/PageHero";
import { TileGrid } from "@/components/pages/TileGrid";
import { ProductRow } from "@/components/shop/ProductRow";
import { categories } from "@/content/categories";
import { needHelp } from "@/content/home";
import { marketplacePage as copy } from "@/content/marketplace";
import { photoImage } from "@/content/photos";
import { spaces } from "@/content/spaces";
import { getCatalog } from "@/lib/catalog";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Nature Marketplace",
  description: copy.intro,
  path: "/marketplace",
});

const whatsappHref = needHelp.channels.find((channel) => channel.kind === "whatsapp")?.href ?? "";
const ROW = 4;

export default async function MarketplacePage() {
  const { products } = await getCatalog(null);
  const bestSellers = products.filter((p) => p.badges?.includes("bestseller")).slice(0, ROW);
  const newArrivals = products.filter((p) => p.badges?.includes("new")).slice(0, ROW);
  const offers = products
    .filter((p) => p.compareAtPrice && p.compareAtPrice > p.price)
    .slice(0, ROW);

  return (
    <>
      <PageHero
        eyebrow={copy.eyebrow}
        title={copy.title}
        intro={copy.intro}
        image={photoImage("pothos-shelf", "Trailing plants on a shelf in warm light")}
      />
      <TileGrid
        title={copy.categoriesTitle}
        columns={4}
        tiles={categories.map((c) => ({
          title: c.title,
          href: c.href,
          image: { src: c.image.src, alt: "" },
        }))}
      />
      <ProductRow
        id={copy.bestSellers.id}
        title={copy.bestSellers.title}
        empty={copy.bestSellers.empty}
        products={bestSellers}
        whatsappHref={whatsappHref}
        more={copy.viewAll}
      />
      <ProductRow
        id={copy.newArrivals.id}
        title={copy.newArrivals.title}
        empty={copy.newArrivals.empty}
        products={newArrivals}
        whatsappHref={whatsappHref}
      />
      <ProductRow
        id={copy.offers.id}
        title={copy.offers.title}
        empty={copy.offers.empty}
        products={offers}
        whatsappHref={whatsappHref}
      />
      <TileGrid
        title={copy.spacesTitle}
        columns={4}
        tiles={spaces.map((space) => ({
          title: space.title,
          body: space.blurb,
          href: `/spaces/${space.slug}`,
          image: photoImage(space.photo, space.photoAlt),
        }))}
      />
      <TileGrid
        eyebrow={copy.soon.eyebrow}
        title={copy.soon.title}
        intro={copy.soon.intro}
        columns={2}
        tiles={copy.soon.items.map((item, index) => ({
          title: item.title,
          body: item.body,
          image: photoImage(index === 0 ? "watering-can" : "spray-bottle", ""),
        }))}
      />
      <CtaBand {...copy.cta} />
    </>
  );
}
