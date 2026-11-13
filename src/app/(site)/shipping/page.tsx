import { FactCards } from "@/components/pages/FactCards";
import { HelpStrip } from "@/components/pages/HelpStrip";
import { PolicyLayout } from "@/components/pages/PolicyLayout";
import { ProcessCards } from "@/components/pages/ProcessCards";
import { shippingPage as copy } from "@/content/pages-copy";
import { shippingExtra as extra } from "@/content/pages-extra";
import { seo } from "@/content/seo";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: copy.title,
  description: seo.pageDescription(copy.title),
  path: "/shipping",
});

export default function ShippingPage() {
  return (
    <>
      <PolicyLayout {...copy} lead={<FactCards flush items={extra.facts} />} />
      <ProcessCards eyebrow={extra.stepsEyebrow} title={extra.stepsTitle} steps={extra.steps} />
      <HelpStrip body={extra.help} />
    </>
  );
}
