import "server-only";
import { db } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";
import {
  SOCIAL_PLATFORMS,
  type SettingsSection,
  announcementSchema,
  phonesSchema,
  seoSchema,
  socialsSchema,
} from "./settings-schema";

export type SettingsRow = typeof siteSettings.$inferSelect;

export async function loadSettingsRow(): Promise<SettingsRow | null> {
  // Admin pages only: callers are behind requireStaff in the admin layout.
  const [row] = await db().select().from(siteSettings).limit(1);
  return row ?? null;
}

/** Current values per form section, flattened to the form field names. */
export function settingsFormValues(
  row: SettingsRow | null,
): Record<SettingsSection, Record<string, string | boolean>> {
  const phones = phonesSchema.parse(row?.phones ?? {});
  const announcement = announcementSchema.parse(row?.announcement ?? {});
  const socials = socialsSchema.parse(row?.socials ?? []);
  const seo = seoSchema.parse(row?.seo ?? {});
  const hrefFor = (platform: string): string => {
    const href = socials.find((social) => social.platform === platform)?.href ?? "";
    return href === "#" ? "" : href;
  };

  return {
    details: {
      storeName: row?.storeName ?? "",
      email: row?.email ?? "",
      address: row?.address ?? "",
      legal: row?.legal ?? "",
    },
    contact: {
      whatsappDisplay: phones.whatsapp.display,
      whatsappE164: phones.whatsapp.e164,
      callDisplay: phones.call.display,
      callE164: phones.call.e164,
    },
    announcement: { message: announcement.message, enabled: announcement.enabled },
    socials: Object.fromEntries(SOCIAL_PLATFORMS.map((platform) => [platform, hrefFor(platform)])),
    seo: {
      homeTitle: seo.home.title,
      homeDescription: seo.home.description,
      ogAlt: seo.ogImage.alt,
    },
    logo: { logoMediaId: row?.logoMediaId ?? "" },
  };
}
