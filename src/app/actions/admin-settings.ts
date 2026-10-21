"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import type { z } from "zod";
import { ACCESS, staffWithRole } from "@/lib/auth/staff";
import {
  SITE_SETTINGS_TAG,
  SOCIAL_PLATFORMS,
  type SettingsSection,
  announcementSchema,
  isSettingsSection,
  phonesSchema,
  seoSchema,
  settingsSections,
  socialsSchema,
} from "@/lib/admin/settings-schema";
import { loadSettingsRow } from "@/lib/admin/settings";
import { eq } from "drizzle-orm";
import { withActor } from "@/lib/db";
import { siteSettings as siteSettingsTable } from "@/lib/db/schema";

export interface SettingsState {
  status: "idle" | "saved" | "invalid" | "forbidden" | "failed";
  fieldErrors?: string[];
}

const CHECKBOXES: Partial<Record<SettingsSection, string[]>> = { announcement: ["enabled"] };

function readSection(section: SettingsSection, formData: FormData): Record<string, unknown> {
  const shape = settingsSections[section].shape;
  const checkboxes = CHECKBOXES[section] ?? [];
  return Object.fromEntries(
    Object.keys(shape).map((key) => [
      key,
      checkboxes.includes(key) ? formData.get(key) === "on" : String(formData.get(key) ?? ""),
    ]),
  );
}

type Values<S extends SettingsSection> = z.output<(typeof settingsSections)[S]>;

/** Maps validated form values onto the row, merging into jsonb so seed flags are kept. */
async function buildUpdate(
  section: SettingsSection,
  values: Values<SettingsSection>,
): Promise<Partial<typeof siteSettingsTable.$inferInsert>> {
  const row = await loadSettingsRow();
  switch (section) {
    case "details": {
      const v = values as Values<"details">;
      return {
        storeName: v.storeName,
        email: v.email,
        address: v.address,
        legal: v.legal || null,
      };
    }
    case "contact": {
      const v = values as Values<"contact">;
      const phones = phonesSchema.parse(row?.phones ?? {});
      return {
        phones: {
          ...phones,
          whatsapp: { ...phones.whatsapp, display: v.whatsappDisplay, e164: v.whatsappE164 },
          call: { ...phones.call, display: v.callDisplay, e164: v.callE164 },
        },
      };
    }
    case "announcement": {
      const v = values as Values<"announcement">;
      const current = announcementSchema.parse(row?.announcement ?? {});
      return { announcement: { ...current, message: v.message, enabled: v.enabled } };
    }
    case "socials": {
      const v = values as Values<"socials">;
      const current = socialsSchema.parse(row?.socials ?? []);
      const socials = SOCIAL_PLATFORMS.map((platform) => {
        const existing = current.find((social) => social.platform === platform);
        const href = v[platform] || "#";
        const label = existing?.label ?? platform;
        // A real link answers the "placeholder URL" review flag, so it is dropped.
        return href === "#" ? { ...existing, platform, label, href } : { platform, label, href };
      });
      return { socials: socials };
    }
    case "seo": {
      const v = values as Values<"seo">;
      const seo = seoSchema.parse(row?.seo ?? {});
      return {
        seo: {
          ...seo,
          home: { ...seo.home, title: v.homeTitle, description: v.homeDescription },
          ogImage: { ...seo.ogImage, alt: v.ogAlt },
        },
      };
    }
    case "logo": {
      const v = values as Values<"logo">;
      return { logoMediaId: v.logoMediaId || null };
    }
  }
}

export async function saveSettings(
  _previous: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const actor = await staffWithRole(ACCESS.storeSettings);
  if (!actor) return { status: "forbidden" };
  const section = formData.get("section");
  if (!isSettingsSection(section)) return { status: "invalid" };

  const parsed = settingsSections[section].safeParse(readSection(section, formData));
  if (!parsed.success) {
    return {
      status: "invalid",
      fieldErrors: [...new Set(parsed.error.issues.map((issue) => String(issue.path[0])))],
    };
  }

  const update = await buildUpdate(section, parsed.data);
  try {
    // site_settings holds one row. Owners and admins only (checked above); the audit log
    // records the actor through withActor.
    await withActor(actor.id, (tx) =>
      tx.update(siteSettingsTable).set(update).where(eq(siteSettingsTable.singleton, true)),
    );
  } catch (error) {
    console.error("[settings] save failed", error instanceof Error ? error.message : error);
    return { status: "failed" };
  }

  revalidateTag(SITE_SETTINGS_TAG, "max");
  revalidatePath("/admin/settings");
  return { status: "saved" };
}
