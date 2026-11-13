import { CategoryView } from "@/components/shop/CategoryView";
import { seo } from "@/content/seo";
import { shop } from "@/content/shop";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: shop.all.title,
  description: seo.pageDescription(shop.all.title),
  path: "/shop",
});

export default function Page() {
  return <CategoryView category={null} />;
}
