import { bulk } from "@/content/commerce";
import { validateField } from "./enquiry";

// Bulk pricing request from a product page. Shared by the form (inline) and the action.

export const BULK_FIELDS = [
  "company",
  "name",
  "phone",
  "email",
  "quantity",
  "city",
  "timeline",
  "message",
] as const;
export type BulkField = (typeof BULK_FIELDS)[number];
export type BulkValues = Record<BulkField, string>;
export type BulkErrors = Partial<Record<BulkField, string>>;

const MAX_QUANTITY = 1_000_000;

export function validateBulkField(field: BulkField, raw: string): string | undefined {
  const value = raw.trim();
  switch (field) {
    case "name":
      return validateField("name", value) ? bulk.errors.name : undefined;
    case "phone":
      // Required: the team calls or messages back with the quote.
      return value && !validateField("phone", value) ? undefined : bulk.errors.phone;
    case "email":
      return validateField("email", value) ? bulk.errors.email : undefined;
    case "quantity": {
      const n = Number(value);
      return Number.isInteger(n) && n >= 1 && n <= MAX_QUANTITY ? undefined : bulk.errors.quantity;
    }
    case "city":
      return value.length >= 2 ? undefined : bulk.errors.city;
    case "timeline":
      return (bulk.fields.timeline.options as readonly string[]).includes(value)
        ? undefined
        : bulk.errors.timeline;
    case "company":
    case "message":
      return undefined;
  }
}

export function validateBulk(values: BulkValues): BulkErrors {
  const errors: BulkErrors = {};
  for (const field of BULK_FIELDS) {
    const error = validateBulkField(field, values[field]);
    if (error) errors[field] = error;
  }
  return errors;
}

/** The request as plain text lines, for the email and the WhatsApp fallback. */
export function bulkMessage(product: string, values: BulkValues): string {
  const m = bulk.message;
  return [
    m.greeting(product),
    "",
    `${m.product}: ${product}`,
    values.company.trim() ? `${m.company}: ${values.company.trim()}` : "",
    `${m.name}: ${values.name.trim()}`,
    `${m.phone}: ${values.phone.trim()}`,
    `${m.email}: ${values.email.trim()}`,
    `${m.quantity}: ${values.quantity.trim()}`,
    `${m.city}: ${values.city.trim()}`,
    `${m.timeline}: ${values.timeline}`,
    values.message.trim() ? `${m.details}: ${values.message.trim()}` : "",
  ]
    .filter((line, index) => line !== "" || index === 1)
    .join("\n");
}
