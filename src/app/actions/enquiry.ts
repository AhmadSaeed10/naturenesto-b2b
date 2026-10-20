"use server";

import { forms } from "@/content/forms";
import { emailEnabled, sendEmail } from "@/lib/email";
import { FIELDS, validateEnquiry, type EnquiryKind, type FieldErrors } from "@/lib/enquiry";

export interface EnquiryState {
  status: "idle" | "invalid" | "sent" | "not_connected";
  errors: FieldErrors;
  values: Record<string, string>;
}

const isKind = (value: unknown): value is EnquiryKind =>
  value === "contact" || value === "consultation";

/**
 * Validates on the server, then emails the store when Resend is configured. Without it
 * (or if sending fails) the visitor is pointed to WhatsApp and email instead.
 */
export async function submitEnquiry(
  _previous: EnquiryState,
  formData: FormData,
): Promise<EnquiryState> {
  const kind = formData.get("kind");
  if (!isKind(kind)) return { status: "invalid", errors: {}, values: {} };

  const values: Record<string, string> = {};
  for (const field of FIELDS[kind]) {
    const value = formData.get(field);
    values[field] = typeof value === "string" ? value : "";
  }

  // Honeypot: real visitors never see this field, so a value means a bot. Answer the same
  // way as a real submission so bots learn nothing.
  if (formData.get("company")) return { status: "not_connected", errors: {}, values: {} };

  const errors = validateEnquiry(kind, values);
  if (Object.keys(errors).length > 0) return { status: "invalid", errors, values };

  if (emailEnabled()) {
    const sent = await sendEmail({
      subject: forms.email.subject[kind](values.name?.trim() ?? ""),
      text: FIELDS[kind]
        .filter((field) => values[field]?.trim())
        .map((field) => `${forms.email.labels[field]}: ${values[field]?.trim()}`)
        .join("\n"),
      replyTo: values.email?.trim(),
    });
    if (sent) return { status: "sent", errors: {}, values: {} };
  }
  return { status: "not_connected", errors: {}, values: {} };
}
