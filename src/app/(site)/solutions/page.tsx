import { CtaBand } from "@/components/pages/CtaBand";
import { PageHero } from "@/components/pages/PageHero";
import { ProcessCards } from "@/components/pages/ProcessCards";
import { TileGrid } from "@/components/pages/TileGrid";
import { photoImage } from "@/content/photos";
import { solutions, solutionsPage as copy } from "@/content/solutions";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Solutions",
  description: copy.intro,
  path: "/solutions",
});

export default function SolutionsPage() {
  return (
    <>
      <PageHero
        eyebrow={copy.eyebrow}
        title={copy.title}
        intro={copy.intro}
        image={photoImage("room-plants-b", "A living room corner styled with large leafy plants")}
      />
      <TileGrid
        tiles={solutions.map((item) => ({
          title: item.title,
          body: item.short,
          href: `/solutions/${item.slug}`,
          image: photoImage(item.photo, item.photoAlt),
        }))}
      />
      <ProcessCards {...copy.process} />
      <CtaBand title={copy.studioTitle} body={copy.studioBody} primary={copy.studioCta} />
      <CtaBand {...copy.cta} />
    </>
  );
}
