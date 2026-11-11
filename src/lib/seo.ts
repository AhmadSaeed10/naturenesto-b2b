import type { Metadata } from "next";
import { site } from "@/content/site";
import { seo } from "@/content/seo";

interface PageMetadataInput {
  title: string;
  description: string;
  path: string;
  /** Use the title as is, without the "| Nature Nesto" template. */
  absoluteTitle?: boolean;
  /** Social share image; defaults to the site image. */
  image?: { url: string; alt: string };
}

const ogImage = {
  url: seo.ogImage.url,
  width: seo.ogImage.width,
  height: seo.ogImage.height,
  alt: seo.ogImage.alt,
};

export function pageMetadata({
  title,
  description,
  path,
  absoluteTitle = false,
  image,
}: PageMetadataInput): Metadata {
  const images = image ? [{ url: image.url, alt: image.alt }] : [ogImage];
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: site.name,
      locale: "en_PK",
      type: "website",
      images,
    },
    twitter: { card: "summary_large_image", title, description, images },
  };
}

/** schema.org LocalBusiness for the homepage. Socials are omitted until real URLs exist. */
export function localBusinessJsonLd(baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: site.name,
    url: baseUrl,
    image: new URL(seo.ogImage.url, baseUrl).toString(),
    logo: new URL("/brand/logo-full.png", baseUrl).toString(),
    email: site.email,
    telephone: site.phones.call.e164,
    description: seo.home.description,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address,
      addressLocality: "Lahore",
      addressCountry: "PK",
    },
  };
}

export const siteUrl = (): string => process.env.NEXT_PUBLIC_SITE_URL ?? site.url;
