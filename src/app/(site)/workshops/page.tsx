import Image from "next/image";
import { RichText } from "@/components/cms/RichText";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { StubPage } from "@/components/ui/StubPage";
import { cms } from "@/content/cms";
import { stubPages } from "@/content/pages";
import { seo } from "@/content/seo";
import { type Workshop, getWorkshopGroups } from "@/lib/cms/content";
import { formatPrice } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";

const stub = stubPages.find((page) => page.path === "/workshops");
const WHEN = new Intl.DateTimeFormat("en-PK", {
  dateStyle: "full",
  timeStyle: "short",
  timeZone: "Asia/Karachi",
});
const copy = cms.workshops;

export const metadata = pageMetadata({
  title: copy.title,
  description: seo.pageDescription(copy.title),
  path: "/workshops",
});

function WorkshopCard({ workshop }: { workshop: Workshop }) {
  return (
    <article className="grid gap-6 rounded-card border border-line bg-background p-5 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:p-6">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-surface">
        {workshop.cover ? (
          <Image
            src={workshop.cover.src}
            alt={workshop.cover.alt}
            fill
            sizes="(min-width: 768px) 35vw, 100vw"
            className="object-cover"
          />
        ) : null}
      </div>
      <div className="flex flex-col gap-4">
        <h3 className="font-serif text-h3">{workshop.title}</h3>
        <dl className="grid gap-2 text-small sm:grid-cols-2">
          {workshop.startsAt ? (
            <div>
              <dt className="text-ink-muted">{copy.when}</dt>
              <dd>
                <time dateTime={workshop.startsAt}>{WHEN.format(new Date(workshop.startsAt))}</time>
              </dd>
            </div>
          ) : null}
          {workshop.location ? (
            <div>
              <dt className="text-ink-muted">{copy.where}</dt>
              <dd>{workshop.location}</dd>
            </div>
          ) : null}
          {workshop.price !== null ? (
            <div>
              <dt className="text-ink-muted">{copy.price}</dt>
              <dd>{workshop.price === 0 ? copy.free : formatPrice(workshop.price)}</dd>
            </div>
          ) : null}
          {workshop.capacity ? (
            <div>
              <dt className="sr-only">{copy.places(workshop.capacity)}</dt>
              <dd>{copy.places(workshop.capacity)}</dd>
            </div>
          ) : null}
        </dl>
        {workshop.summary ? <p className="text-lead text-ink-muted">{workshop.summary}</p> : null}
        <RichText source={workshop.body} />
        <div>
          <Button href="/contact" withArrow>
            {copy.book}
          </Button>
        </div>
      </div>
    </article>
  );
}

export default async function WorkshopsPage() {
  const { upcoming, past } = await getWorkshopGroups();
  if (upcoming.length + past.length === 0) {
    return <StubPage title={stub?.title ?? copy.title} body={stub?.todo ?? ""} />;
  }

  return (
    <section className="mx-auto flex max-w-7xl flex-col gap-12 px-4 py-20 md:px-8 lg:py-28">
      <Reveal className="flex flex-col gap-6">
        <Eyebrow>{copy.eyebrow}</Eyebrow>
        <h1 className="text-h1">{copy.title}</h1>
      </Reveal>
      {[
        { title: copy.upcoming, list: upcoming },
        { title: copy.past, list: past },
      ]
        .filter((group) => group.list.length > 0)
        .map((group) => (
          <section key={group.title} className="flex flex-col gap-6">
            <h2 className="eyebrow text-ink-muted">{group.title}</h2>
            {group.list.map((workshop) => (
              <WorkshopCard key={workshop.handle} workshop={workshop} />
            ))}
          </section>
        ))}
    </section>
  );
}
