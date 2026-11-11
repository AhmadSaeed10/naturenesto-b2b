import { PolicyLayout } from "@/components/pages/PolicyLayout";
import { shippingPage as copy } from "@/content/pages-copy";
import { seo } from "@/content/seo";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: copy.title,
  description: seo.pageDescription(copy.title),
  path: "/shipping",
});

export default function ShippingPage() {
  return <PolicyLayout {...copy} />;
}
