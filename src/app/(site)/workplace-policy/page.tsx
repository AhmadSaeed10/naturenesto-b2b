import { FactCards } from "@/components/pages/FactCards";
import { HelpStrip } from "@/components/pages/HelpStrip";
import { PolicyLayout } from "@/components/pages/PolicyLayout";
import { policyPage as copy } from "@/content/pages-copy";
import { policyExtra as extra } from "@/content/pages-extra";
import { seo } from "@/content/seo";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: copy.title,
  description: seo.pageDescription(copy.title),
  path: "/workplace-policy",
});

export default function WorkplacePolicyPage() {
  return (
    <>
      <PolicyLayout {...copy} lead={<FactCards flush items={extra.facts} />} />
      <HelpStrip body={extra.help} />
    </>
  );
}
