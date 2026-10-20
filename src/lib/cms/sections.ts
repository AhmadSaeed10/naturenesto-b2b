import { z } from "zod";
import { categories, categoriesTitle } from "@/content/categories";
import { banner, hero, needHelp, taglineStrip, valueProps } from "@/content/home";
import { services, servicesEyebrow } from "@/content/services";
import { howItWorks, steps } from "@/content/steps";
import { ICON_NAMES } from "@/content/types";

// Typed JSON blocks for page_sections.data. Only the fields the components render are
// kept; review flags stay in src/content, which remains their source of truth.

const ICONS = ICON_NAMES;

const text = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) => z.string().trim().max(max);
// Internal paths, https links, and the contact schemes used by the Need Help channels.
export const href = z
  .string()
  .trim()
  .max(500)
  .regex(/^(\/(?!\/)|https:\/\/|mailto:|tel:|#)/);

const cta = z.object({ label: text(60), href });
const image = z.object({ src: z.string().trim().min(1).max(500), alt: optionalText(300) });

export const sectionSchemas = {
  hero: z.object({
    headline: text(120),
    subline: text(120),
    secondary: text(160),
    cta,
    poster: z.object({ src: z.string().trim().min(1).max(500) }),
    video: z.object({
      src: z
        .string()
        .trim()
        .max(500)
        .regex(/^(https:\/\/|\/)/),
    }),
  }),
  tagline: z.object({
    items: z
      .array(z.object({ text: text(80), icon: z.enum(ICONS) }))
      .min(1)
      .max(6),
  }),
  value_props: z.object({
    items: z
      .array(z.object({ title: text(80), body: text(400), icon: z.enum(ICONS) }))
      .min(1)
      .max(6),
  }),
  how_it_works: z.object({
    eyebrow: text(80),
    title: text(120),
    steps: z
      .array(z.object({ number: text(4), title: text(80), body: text(600) }))
      .min(1)
      .max(8),
  }),
  services: z.object({
    eyebrow: text(80),
    services: z
      .array(
        z.object({
          slug: text(80),
          title: text(120),
          href,
          legacyPath: optionalText(300),
          icon: z.enum(ICONS),
          featured: z.boolean().optional(),
        }),
      )
      .min(1)
      .max(12),
  }),
  banner: z.object({ headline: text(160), secondary: text(160), cta, image }),
  plants: z.object({
    title: text(120),
    categories: z
      .array(z.object({ slug: text(80), title: text(120), href, image }))
      .min(1)
      .max(12),
  }),
  need_help: z.object({
    title: text(80),
    body: text(600),
    signOff: text(120),
    channels: z
      .array(
        z.object({
          kind: z.enum(["whatsapp", "call", "email"]),
          label: text(60),
          prompt: text(80),
          display: text(120),
          href,
        }),
      )
      .min(1)
      .max(4),
  }),
} as const;

export type HomeSectionType = keyof typeof sectionSchemas;
export const HOME_SECTION_ORDER: HomeSectionType[] = [
  "hero",
  "tagline",
  "value_props",
  "how_it_works",
  "services",
  "banner",
  "plants",
  "need_help",
];
export const isHomeSectionType = (value: string): value is HomeSectionType =>
  value in sectionSchemas;

export type SectionData<T extends HomeSectionType> = z.output<(typeof sectionSchemas)[T]>;

/** The copy shipped in src/content, used whenever the database has nothing valid. */
export const sectionFallbacks: { [T in HomeSectionType]: SectionData<T> } = {
  hero,
  tagline: { items: taglineStrip },
  value_props: { items: valueProps },
  how_it_works: { ...howItWorks, steps },
  services: { eyebrow: servicesEyebrow, services },
  banner,
  plants: { title: categoriesTitle, categories },
  need_help: needHelp,
};

export type HomeSections = { [T in HomeSectionType]: SectionData<T> | null };

export function parseSection<T extends HomeSectionType>(
  type: T,
  data: unknown,
): SectionData<T> | null {
  const parsed = sectionSchemas[type].safeParse(data);
  return parsed.success ? (parsed.data as SectionData<T>) : null;
}
