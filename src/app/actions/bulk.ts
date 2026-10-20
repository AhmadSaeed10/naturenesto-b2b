"use server";

import { bulk } from "@/content/commerce";
import { getProduct } from "@/lib/catalog";
import {
  BULK_FIELDS,
  bulkMessage,
  validateBulk,
  type BulkErrors,
  type BulkValues,
} from "@/lib/bulk";
import { emailEnabled, sendEmail } from "@/lib/email";

export type BulkState =
  | { status: "idle" }
  | { status: "invalid"; errors: BulkErrors; values: BulkValues }
  | { status: "sent" }
  | { status: "whatsapp"; message: string }
  | { status: "error"; values: BulkValues };

export async function requestBulkQuote(
  _previous: BulkState,
  formData: FormData,
): Promise<BulkState> {
  const values = Object.fromEntries(
    BULK_FIELDS.map((field) => [field, String(formData.get(field) ?? "")]),
  ) as BulkValues;
  // Honeypot ("website", since "company" is a real field here): answer as if sent.
  if (formData.get("website")) return { status: "sent" };

  const errors = validateBulk(values);
  if (Object.keys(errors).length > 0) return { status: "invalid", errors, values };

  const product = await getProduct(String(formData.get("product") ?? ""));
  if (!product) return { status: "error", values };
  const message = bulkMessage(product.name, values);

  // Without email configured, hand the written request to WhatsApp instead of losing it.
  if (!emailEnabled()) return { status: "whatsapp", message };
  const sent = await sendEmail({
    subject: bulk.message.subject(product.name),
    text: message,
    replyTo: values.email.trim(),
  });
  return sent ? { status: "sent" } : { status: "whatsapp", message };
}
