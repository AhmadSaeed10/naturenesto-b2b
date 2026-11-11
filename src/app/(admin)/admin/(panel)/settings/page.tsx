import { redirect } from "next/navigation";
import { AdminCard } from "@/components/admin/AdminPage";
import { SettingsForm, type SettingsField } from "@/components/admin/settings/SettingsForm";
import { admin } from "@/content/admin";
import { listMediaOptions } from "@/lib/admin/media";
import { loadSettingsRow, settingsFormValues } from "@/lib/admin/settings";
import { SOCIAL_PLATFORMS, type SettingsSection } from "@/lib/admin/settings-schema";
import { canAccess, requireStaff } from "@/lib/auth/staff";

const copy = admin.settings.store;
const SOCIAL_LABELS: Record<(typeof SOCIAL_PLATFORMS)[number], string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  twitter: "Twitter",
};

export default async function StoreSettingsPage() {
  const staff = await requireStaff();
  if (!canAccess(staff, "storeSettings")) redirect("/admin/settings/account");

  const [row, mediaOptions] = await Promise.all([loadSettingsRow(), listMediaOptions()]);
  const values = settingsFormValues(row);

  const sections: {
    key: SettingsSection;
    title: string;
    description?: string;
    fields: SettingsField[];
  }[] = [
    {
      key: "details",
      title: copy.details.title,
      fields: [
        { kind: "text", name: "storeName", label: copy.details.storeName },
        { kind: "text", name: "email", label: copy.details.email, type: "email" },
        { kind: "text", name: "address", label: copy.details.address, multiline: true },
        { kind: "text", name: "legal", label: copy.details.legal },
      ],
    },
    {
      key: "contact",
      title: copy.contact.title,
      fields: [
        { kind: "text", name: "whatsappDisplay", label: copy.contact.whatsappDisplay },
        {
          kind: "text",
          name: "whatsappE164",
          label: copy.contact.whatsappE164,
          hint: copy.contact.e164Hint,
        },
        { kind: "text", name: "callDisplay", label: copy.contact.callDisplay },
        {
          kind: "text",
          name: "callE164",
          label: copy.contact.callE164,
          hint: copy.contact.e164Hint,
        },
      ],
    },
    {
      key: "announcement",
      title: copy.announcement.title,
      fields: [
        { kind: "text", name: "message", label: copy.announcement.message },
        { kind: "checkbox", name: "enabled", label: copy.announcement.enabled },
      ],
    },
    {
      key: "socials",
      title: copy.socials.title,
      description: copy.socials.hint,
      fields: SOCIAL_PLATFORMS.map((platform) => ({
        kind: "text" as const,
        name: platform,
        label: SOCIAL_LABELS[platform],
      })),
    },
    {
      key: "seo",
      title: copy.seo.title,
      fields: [
        { kind: "text", name: "homeTitle", label: copy.seo.homeTitle },
        { kind: "text", name: "homeDescription", label: copy.seo.homeDescription, multiline: true },
        { kind: "text", name: "ogAlt", label: copy.seo.ogAlt },
      ],
    },
    {
      key: "logo",
      title: copy.logo.title,
      description: copy.logo.intro,
      fields: [
        {
          kind: "select",
          name: "logoMediaId",
          label: copy.logo.field,
          options: [
            { value: "", label: copy.logo.none },
            ...mediaOptions.map((o) => ({ value: o.id, label: o.label })),
          ],
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <p className="rounded-card border border-dashed border-ink/30 bg-background p-4 text-sm text-ink-muted">
        {admin.settings.liveNote}
      </p>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {sections.map((section) => (
          <AdminCard key={section.key} title={section.title} description={section.description}>
            <SettingsForm
              section={section.key}
              fields={section.fields}
              values={values[section.key]}
            />
          </AdminCard>
        ))}
      </div>
    </div>
  );
}
