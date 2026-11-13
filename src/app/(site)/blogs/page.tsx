import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { CtaBand } from "@/components/pages/CtaBand";
import { TopicChips } from "@/components/pages/TopicChips";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { StubPage } from "@/components/ui/StubPage";
import { cms } from "@/content/cms";
import { blogTopics } from "@/content/pages-extra";
import { stubPages } from "@/content/pages";
import { seo } from "@/content/seo";
import { listPosts } from "@/lib/cms/content";
import { pageMetadata } from "@/lib/seo";

const DATE = new Intl.DateTimeFormat("en-PK", { dateStyle: "long", timeZone: "Asia/Karachi" });
const stub = stubPages.find((page) => page.path === "/blogs");

export const metadata = pageMetadata({
  title: cms.blog.title,
  description: seo.pageDescription(cms.blog.title),
  path: "/blogs",
});

export default async function BlogsPage() {
  const posts = await listPosts();
  // Until the first post is published the page keeps its placeholder.
  if (posts.length === 0)
    return (
      <>
        <StubPage title={stub?.title ?? cms.blog.title} body={stub?.todo ?? ""} />
        <TopicChips {...blogTopics} />
        <CtaBand {...blogTopics.cta} />
      </>
    );

  return (
    <>
      <section className="mx-auto flex max-w-7xl flex-col gap-12 px-4 py-20 md:px-8 lg:py-28">
        <Reveal className="flex flex-col gap-6">
          <Eyebrow>{cms.blog.eyebrow}</Eyebrow>
          <h1 className="text-h1">{cms.blog.title}</h1>
        </Reveal>
        <Stagger as="ul" className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <StaggerItem as="li" key={post.handle}>
              <Link href={`/blogs/${post.handle}`} className="group flex h-full flex-col gap-4">
                <div className="relative aspect-[4/5] overflow-hidden rounded-card bg-surface">
                  {post.cover ? (
                    <Image
                      src={post.cover.src}
                      alt={post.cover.alt}
                      fill
                      sizes="(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 100vw"
                      className="object-cover transition-transform duration-(--duration-reveal) ease-brand group-hover:scale-105"
                    />
                  ) : null}
                </div>
                {post.publishedAt ? (
                  <time dateTime={post.publishedAt} className="text-small text-ink-muted">
                    {DATE.format(new Date(post.publishedAt))}
                  </time>
                ) : null}
                <h2 className="font-serif text-h4 text-ink group-hover:underline group-hover:underline-offset-4">
                  {post.title}
                </h2>
                {post.excerpt ? <p className="text-ink-muted">{post.excerpt}</p> : null}
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </section>
      <TopicChips {...blogTopics} />
      <CtaBand {...blogTopics.cta} />
    </>
  );
}
