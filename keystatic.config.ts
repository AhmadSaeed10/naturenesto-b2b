import { collection, config, fields, singleton } from "@keystatic/core";
import { catalogCategories } from "./src/content/catalog";
import { ICON_NAMES, PRODUCT_BADGES } from "./src/content/types";

// Git based CMS. Locally it edits files on disk; in production it signs in with GitHub and
// commits to the repo, and Vercel redeploys. Shapes mirror the zod schemas in
// src/lib/cms, which validate every read and fall back to src/content when a value is bad.

const REPO = "AhmadSaeed10/naturenesto-b2b";

// Same rule as the storefront validator: site paths, https links and contact schemes.
const HREF_PATTERN = {
  regex: /^(\/(?!\/)|https:\/\/|mailto:|tel:|#)/,
  message: "Use /path, https://, mailto: or tel:",
};

const text = (label: string, opts: { multiline?: boolean; description?: string } = {}) =>
  fields.text({ label, ...opts, validation: { length: { min: 1 } } });
const optionalText = (label: string, opts: { multiline?: boolean; description?: string } = {}) =>
  fields.text({ label, ...opts });
const href = (label = "Link") => fields.text({ label, validation: { pattern: HREF_PATTERN } });
const richText = (label: string) =>
  fields.text({
    label,
    multiline: true,
    description:
      "Supports ## heading, **bold**, *italic*, [link](https://...), - list, 1. list and > quote.",
  });
const icon = fields.select({
  label: "Icon",
  options: ICON_NAMES.map((name) => ({ label: name, value: name })),
  defaultValue: "leaf",
});
const cta = (label: string) => fields.object({ label: text("Label"), href: href() }, { label });
const shown = fields.checkbox({
  label: "Show on the homepage",
  defaultValue: true,
});
const seoFields = {
  seoTitle: optionalText("SEO title"),
  seoDescription: optionalText("SEO description", { multiline: true }),
};

const navLinks = (label: string) =>
  fields.array(fields.object({ label: text("Label"), href: href() }), {
    label,
    itemLabel: (props) => props.fields.label.value || "Link",
  });

export default config({
  storage:
    process.env.NEXT_PUBLIC_KEYSTATIC_STORAGE === "github"
      ? { kind: "github", repo: REPO }
      : { kind: "local" },
  ui: {
    brand: { name: "Nature Nesto" },
    navigation: {
      Shop: ["products"],
      Site: ["settings", "navigation", "home"],
      Content: ["pages", "posts", "workshops", "faq", "redirects"],
    },
  },
  singletons: {
    settings: singleton({
      label: "Store settings",
      path: "content/settings",
      schema: {
        announcement: fields.object(
          {
            enabled: fields.checkbox({ label: "Show announcement bar", defaultValue: true }),
            message: text("Message"),
          },
          { label: "Announcement bar" },
        ),
        email: text("Email", {
          description: "Shown in the footer. Orders and quotes go to ORDER_EMAIL_TO.",
        }),
        address: text("Address", { multiline: true }),
        legal: text("Copyright line"),
        whatsapp: fields.text({
          label: "WhatsApp number",
          description: "International format, for example +923180427602.",
          validation: { pattern: { regex: /^\+\d{7,15}$/, message: "Use +92 and digits only" } },
        }),
        socials: fields.array(
          fields.object({
            platform: fields.select({
              label: "Platform",
              options: [
                { label: "Facebook", value: "facebook" },
                { label: "Instagram", value: "instagram" },
                { label: "LinkedIn", value: "linkedin" },
                { label: "Twitter", value: "twitter" },
              ],
              defaultValue: "instagram",
            }),
            label: text("Label"),
            href: href("URL"),
          }),
          { label: "Social links", itemLabel: (props) => props.fields.label.value || "Social" },
        ),
        seo: fields.object(
          {
            title: text("Homepage title"),
            description: text("Homepage description", { multiline: true }),
          },
          { label: "Homepage SEO" },
        ),
        delivery: fields.object(
          {
            lahore: fields.integer({ label: "Lahore delivery fee (PKR)", validation: { min: 0 } }),
            punjab: fields.integer({ label: "Rest of Punjab fee (PKR)", validation: { min: 0 } }),
            pakistan: fields.integer({
              label: "Rest of Pakistan fee (PKR)",
              validation: { min: 0 },
            }),
            freeOver: fields.integer({
              label: "Free delivery over (PKR)",
              description: "Leave empty for no free delivery.",
              validation: { min: 0 },
            }),
          },
          { label: "Delivery fees" },
        ),
      },
    }),
    navigation: singleton({
      label: "Navigation",
      path: "content/navigation",
      schema: {
        header: navLinks("Header links (after the Shop menu)"),
        headerCta: cta("Header button"),
        footer: fields.array(
          fields.object({ heading: text("Heading"), links: navLinks("Links") }),
          { label: "Footer columns", itemLabel: (props) => props.fields.heading.value || "Column" },
        ),
      },
    }),
    home: singleton({
      label: "Homepage",
      path: "content/home",
      schema: {
        hero: fields.object(
          {
            show: shown,
            headline: text("Headline"),
            subline: text("Subline"),
            secondary: text("Secondary line"),
            cta: cta("Button"),
            poster: fields.object(
              {
                src: fields.image({
                  label: "Poster image",
                  directory: "public/images",
                  publicPath: "/images/",
                  validation: { isRequired: true },
                }),
              },
              { label: "Poster" },
            ),
            video: fields.object(
              {
                src: fields.text({
                  label: "Video URL",
                  validation: {
                    pattern: { regex: /^(https:\/\/|\/)/, message: "Use https:// or /path" },
                  },
                }),
              },
              { label: "Background video" },
            ),
          },
          { label: "Hero" },
        ),
        tagline: fields.object(
          {
            show: shown,
            items: fields.array(fields.object({ text: text("Text"), icon }), {
              label: "Items",
              itemLabel: (props) => props.fields.text.value,
              validation: { length: { min: 1, max: 6 } },
            }),
          },
          { label: "Tagline strip" },
        ),
        value_props: fields.object(
          {
            show: shown,
            items: fields.array(
              fields.object({
                title: text("Title"),
                body: text("Body", { multiline: true }),
                icon,
              }),
              {
                label: "Value props",
                itemLabel: (props) => props.fields.title.value,
                validation: { length: { min: 1, max: 6 } },
              },
            ),
          },
          { label: "Value props" },
        ),
        how_it_works: fields.object(
          {
            show: shown,
            eyebrow: text("Eyebrow"),
            title: text("Title"),
            steps: fields.array(
              fields.object({
                number: text("Number"),
                title: text("Title"),
                body: text("Body", { multiline: true }),
              }),
              {
                label: "Steps",
                itemLabel: (props) => `${props.fields.number.value} ${props.fields.title.value}`,
                validation: { length: { min: 1, max: 8 } },
              },
            ),
          },
          { label: "How it works" },
        ),
        services: fields.object(
          {
            show: shown,
            eyebrow: text("Eyebrow"),
            services: fields.array(
              fields.object({
                slug: text("Slug", {
                  description: "Matches a page under /services. Do not change.",
                }),
                title: text("Title"),
                href: href(),
                legacyPath: optionalText("Old site path"),
                icon,
                featured: fields.checkbox({ label: "Featured (botanical frame)" }),
              }),
              {
                label: "Services",
                itemLabel: (props) => props.fields.title.value,
                validation: { length: { min: 1, max: 12 } },
              },
            ),
          },
          { label: "Services grid" },
        ),
        banner: fields.object(
          {
            show: shown,
            headline: text("Headline"),
            secondary: text("Secondary line"),
            cta: cta("Button"),
            image: fields.object(
              {
                src: fields.image({
                  label: "Image",
                  directory: "public/images",
                  publicPath: "/images/",
                  validation: { isRequired: true },
                }),
                alt: optionalText("Alt text", { description: "Leave empty only if decorative." }),
              },
              { label: "Image" },
            ),
          },
          { label: "Banner" },
        ),
        plants: fields.object(
          {
            show: shown,
            title: text("Title"),
            categories: fields.array(
              fields.object({
                slug: text("Slug"),
                title: text("Title"),
                href: href(),
                image: fields.object(
                  {
                    src: fields.image({
                      label: "Image",
                      directory: "public/images/categories",
                      publicPath: "/images/categories/",
                      validation: { isRequired: true },
                    }),
                    alt: optionalText("Alt text", {
                      description: "Empty is fine: the tile label already names the link.",
                    }),
                  },
                  { label: "Image" },
                ),
              }),
              {
                label: "Category tiles",
                itemLabel: (props) => props.fields.title.value,
                validation: { length: { min: 1, max: 12 } },
              },
            ),
          },
          { label: "Plants for everyone" },
        ),
        need_help: fields.object(
          {
            show: shown,
            title: text("Title"),
            body: text("Body", { multiline: true }),
            signOff: text("Sign off"),
            channels: fields.array(
              fields.object({
                kind: fields.select({
                  label: "Kind",
                  options: [
                    { label: "WhatsApp", value: "whatsapp" },
                    { label: "Call", value: "call" },
                    { label: "Email", value: "email" },
                  ],
                  defaultValue: "whatsapp",
                }),
                label: text("Label"),
                prompt: text("Prompt"),
                display: text("Display text"),
                href: href(),
              }),
              {
                label: "Channels",
                itemLabel: (props) => props.fields.label.value,
                validation: { length: { min: 1, max: 4 } },
              },
            ),
          },
          { label: "Need help" },
        ),
      },
    }),
    faq: singleton({
      label: "FAQ",
      path: "content/faq",
      schema: {
        items: fields.array(
          fields.object({
            question: text("Question"),
            answer: richText("Answer"),
            category: optionalText("Group", {
              description: "Questions with the same group are shown together.",
            }),
          }),
          { label: "Questions", itemLabel: (props) => props.fields.question.value },
        ),
      },
    }),
    redirects: singleton({
      label: "Redirects",
      path: "content/redirects",
      schema: {
        items: fields.array(
          fields.object({
            source: fields.text({
              label: "Old path",
              validation: { pattern: { regex: /^\/(?!\/)/, message: "Start with /" } },
            }),
            destination: href("New address"),
            permanent: fields.checkbox({ label: "Permanent (308)", defaultValue: true }),
          }),
          {
            label: "Redirects",
            description: "Applies to addresses that do not exist. Built in redirects run first.",
            itemLabel: (props) =>
              `${props.fields.source.value} to ${props.fields.destination.value}`,
          },
        ),
      },
    }),
  },
  collections: {
    products: collection({
      label: "Products",
      path: "content/products/*",
      slugField: "title",
      columns: ["price", "inStock"],
      schema: {
        title: fields.slug({ name: { label: "Title" }, slug: { label: "Handle (URL)" } }),
        price: fields.integer({ label: "Price (PKR)", validation: { isRequired: true, min: 0 } }),
        compareAtPrice: fields.integer({
          label: "Compare at price (PKR)",
          description: "Shown struck through when higher than the price.",
          validation: { min: 0 },
        }),
        size: optionalText("Size", { description: "For example: Medium, 90 cm." }),
        categories: fields.multiselect({
          label: "Categories",
          options: catalogCategories.map(({ slug, title }) => ({ label: title, value: slug })),
        }),
        badges: fields.multiselect({
          label: "Badges",
          options: PRODUCT_BADGES.map((badge) => ({ label: badge, value: badge })),
        }),
        inStock: fields.checkbox({ label: "In stock", defaultValue: true }),
        sample: fields.checkbox({
          label: "Sample product",
          description: "Placeholder data. Category pages show a notice while any sample is listed.",
        }),
        images: fields.array(
          fields.object({
            src: fields.image({
              label: "Image",
              directory: "public/images/products",
              publicPath: "/images/products/",
              validation: { isRequired: true },
            }),
            alt: optionalText("Alt text", {
              description: "Describe the photo. Empty only when the product name says it all.",
            }),
          }),
          {
            label: "Images",
            itemLabel: (props) => props.fields.alt.value || "Image",
            validation: { length: { min: 1 } },
          },
        ),
        description: richText("Description"),
        ...seoFields,
      },
    }),
    pages: collection({
      label: "Pages",
      path: "content/pages/*",
      slugField: "title",
      schema: {
        title: fields.slug({
          name: { label: "Title" },
          slug: {
            label: "Handle",
            description:
              "about, our-story, careers, shipping or workplace-policy replace those pages.",
          },
        }),
        eyebrow: optionalText("Eyebrow"),
        intro: optionalText("Intro", { multiline: true }),
        image: fields.object(
          {
            src: fields.image({
              label: "Image",
              directory: "public/images/pages",
              publicPath: "/images/pages/",
            }),
            alt: optionalText("Alt text", { description: "Describe the photo." }),
          },
          { label: "Feature image (About page)" },
        ),
        body: richText("Body"),
        ...seoFields,
      },
    }),
    posts: collection({
      label: "Blog posts",
      path: "content/posts/*",
      slugField: "title",
      schema: {
        title: fields.slug({ name: { label: "Title" } }),
        publishedAt: fields.date({
          label: "Publish date",
          description: "Hidden until this date. Empty keeps it as a draft.",
        }),
        excerpt: optionalText("Excerpt", { multiline: true }),
        cover: fields.object(
          {
            src: fields.image({
              label: "Cover image",
              directory: "public/images/posts",
              publicPath: "/images/posts/",
            }),
            alt: optionalText("Alt text"),
          },
          { label: "Cover" },
        ),
        tags: fields.array(fields.text({ label: "Tag" }), {
          label: "Tags",
          itemLabel: (props) => props.value,
        }),
        body: richText("Body"),
        ...seoFields,
      },
    }),
    workshops: collection({
      label: "Workshops",
      path: "content/workshops/*",
      slugField: "title",
      schema: {
        title: fields.slug({ name: { label: "Title" } }),
        published: fields.checkbox({ label: "Published", defaultValue: true }),
        summary: optionalText("Summary", { multiline: true }),
        startsAt: fields.datetime({ label: "Starts" }),
        endsAt: fields.datetime({ label: "Ends" }),
        location: optionalText("Location"),
        capacity: fields.integer({ label: "Places", validation: { min: 0 } }),
        price: fields.integer({
          label: "Price (PKR)",
          description: "Empty or 0 shows Free.",
          validation: { min: 0 },
        }),
        cover: fields.object(
          {
            src: fields.image({
              label: "Cover image",
              directory: "public/images/workshops",
              publicPath: "/images/workshops/",
            }),
            alt: optionalText("Alt text"),
          },
          { label: "Cover" },
        ),
        body: richText("Details"),
      },
    }),
  },
});
