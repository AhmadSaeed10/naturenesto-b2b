import type { Metadata } from "next";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { CmsArticle } from "@/components/cms/CmsArticle";
import { StubPage } from "@/components/ui/StubPage";
import { catalogCategories } from "@/content/catalog";
import { stubPages } from "@/content/pages";
import { seo } from "@/content/seo";
import { services } from "@/content/services";
import { getPublishedPage, getRedirect } from "@/lib/cms/content";
import { richTextPlain } from "@/lib/cms/rich-text";
import { pageMetadata } from "@/lib/seo";

// Inner pages are stubs until content arrives. A dedicated route folder added later
// (for example app/contact) takes priority over this catch-all.
const findPage = (slug: string[]) => stubPages.find((page) => page.path === `/${slug.join("/")}`);

// These paths have dedicated route folders with real content.
const DEDICATED = new Set([
  "/contact",
  "/consultation",
  "/services",
  "/blogs",
  "/workshops",
  "/faq",
  "/about",
  ...services.map((service) => service.href),
  ...catalogCategories.map((category) => category.href),
]);

export function generateStaticParams() {
  return stubPages
    .filter((page) => !DEDICATED.has(page.path))
    .map((page) => ({ slug: page.path.slice(1).split("/") }));
}

// A CMS page with this handle (one segment) and a body replaces the placeholder.
const cmsHandle = (slug: string[]): string | null =>
  slug.length === 1 && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug[0] ?? "") ? (slug[0] ?? null) : null;

export async function generateMetadata({ params }: PageProps<"/[...slug]">): Promise<Metadata> {
  const { slug } = await params;
  const handle = cmsHandle(slug);
  const cmsPage = handle ? await getPublishedPage(handle) : null;
  if (cmsPage?.body.trim()) {
    return pageMetadata({
      title: cmsPage.seoTitle || cmsPage.title,
      description:
        cmsPage.seoDescription || richTextPlain(cmsPage.body) || seo.pageDescription(cmsPage.title),
      path: `/${cmsPage.handle}`,
    });
  }
  const page = findPage(slug);
  return page
    ? pageMetadata({
        title: page.title,
        description: seo.pageDescription(page.title),
        path: page.path,
      })
    : {};
}

export default async function Page({ params }: PageProps<"/[...slug]">) {
  const { slug } = await params;
  const handle = cmsHandle(slug);
  const cmsPage = handle ? await getPublishedPage(handle) : null;
  if (cmsPage?.body.trim()) {
    return (
      <CmsArticle
        eyebrow={cmsPage.eyebrow ?? undefined}
        title={cmsPage.title}
        body={cmsPage.body}
      />
    );
  }

  const page = findPage(slug);
  if (page) return <StubPage title={page.title} body={page.todo} />;

  // Unknown path: an old URL may have a redirect added in the admin.
  const target = await getRedirect(`/${slug.map(encodeURIComponent).join("/")}`);
  if (target) (target.permanent ? permanentRedirect : redirect)(target.destination);
  notFound();
}
