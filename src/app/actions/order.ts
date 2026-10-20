"use server";

import { randomBytes } from "node:crypto";
import { z } from "zod";
import { commerce } from "@/content/commerce";
import { getCartCatalog } from "@/lib/catalog";
import { getDeliveryRates, getSiteChrome } from "@/lib/cms/data";
import { emailEnabled, sendEmail } from "@/lib/email";
import { formatPrice } from "@/lib/format";
import { MAX_ORDER_LINES, isDeliveryZone, priceOrder, type PricedOrder } from "@/lib/order";

export type OrderField = "email" | "phone" | "fullName" | "line1" | "city" | "zone";

export type OrderState =
  | { status: "idle" }
  | { status: "invalid"; fields: OrderField[]; values: Record<string, string> }
  | {
      status: "error";
      error: "unavailable" | "cart_empty" | "failed";
      values: Record<string, string>;
    }
  | {
      status: "placed";
      reference: string;
      order: PricedOrder;
      emailed: boolean;
      whatsappUrl: string;
    };

const phone = z
  .string()
  .trim()
  .regex(/^\+?[\d\s()-]{7,20}$/)
  .refine((value) => {
    const digits = value.replace(/\D/g, "").length;
    return digits >= 7 && digits <= 15;
  });

const orderSchema = z.object({
  email: z.union([z.literal(""), z.email().max(320)]),
  phone,
  fullName: z.string().trim().min(2).max(200),
  line1: z.string().trim().min(3).max(300),
  line2: z.string().trim().max(300),
  city: z.string().trim().min(2).max(120),
  zone: z.string().refine(isDeliveryZone),
  notes: z.string().trim().max(1000),
});

const cartSchema = z
  .array(
    z.object({
      handle: z
        .string()
        .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
        .max(120),
      quantity: z.number().int().min(1).max(99),
    }),
  )
  .min(1)
  .max(MAX_ORDER_LINES);

const FIELDS = Object.keys(orderSchema.shape) as (keyof typeof orderSchema.shape)[];

/** Short, readable and unguessable enough to quote on the phone: NN-7F3K2Q. */
const newReference = (): string =>
  `NN-${randomBytes(4).readUInt32BE().toString(36).toUpperCase().padStart(6, "0").slice(-6)}`;

const m = commerce.message;

export async function placeOrder(_previous: OrderState, formData: FormData): Promise<OrderState> {
  // Honeypot: a value means a bot. It gets a believable failure and nothing is sent.
  const values = Object.fromEntries(FIELDS.map((f) => [f, String(formData.get(f) ?? "")]));
  if (formData.get("company")) return { status: "error", error: "failed", values };

  const parsed = orderSchema.safeParse(values);
  if (!parsed.success) {
    const fields = [...new Set(parsed.error.issues.map((issue) => String(issue.path[0])))];
    return { status: "invalid", fields: fields as OrderField[], values };
  }

  let cartInput: unknown;
  try {
    cartInput = JSON.parse(String(formData.get("cart") ?? "[]"));
  } catch {
    return { status: "error", error: "cart_empty", values };
  }
  const cart = cartSchema.safeParse(cartInput);
  if (!cart.success) return { status: "error", error: "cart_empty", values };

  const v = parsed.data;
  const zone = isDeliveryZone(v.zone) ? v.zone : null;
  const [catalog, rates, chrome] = await Promise.all([
    getCartCatalog(),
    getDeliveryRates(),
    getSiteChrome(),
  ]);
  // Prices come from the catalogue on the server, never from the browser.
  const order = priceOrder(cart.data, catalog, rates, zone);
  if (order.unavailable.length > 0) return { status: "error", error: "unavailable", values };
  if (order.lines.length === 0) return { status: "error", error: "cart_empty", values };

  const reference = newReference();
  const zoneLabel = zone ? commerce.checkout.zones[zone] : "";
  const items = order.lines.map(
    (line) =>
      `${line.quantity} x ${line.name}${line.size ? ` (${line.size})` : ""}: ${formatPrice(line.lineTotal)}`,
  );
  const totals = [
    `${commerce.checkout.subtotal}: ${formatPrice(order.subtotal)}`,
    `${commerce.checkout.shipping}: ${order.delivery === 0 ? commerce.checkout.free : formatPrice(order.delivery ?? 0)}`,
    `${commerce.checkout.total}: ${formatPrice(order.total)}`,
  ];
  const customer = [
    `${m.name}: ${v.fullName}`,
    `${m.phone}: ${v.phone}`,
    v.email ? `${m.email}: ${v.email}` : "",
    `${m.address}: ${[v.line1, v.line2, v.city].filter(Boolean).join(", ")}`,
    `${m.zone}: ${zoneLabel}`,
    v.notes ? `${m.notes}: ${v.notes}` : "",
    m.payment,
  ].filter(Boolean);

  const body = [...items, "", ...totals, "", ...customer].join("\n");

  let emailed = false;
  if (emailEnabled()) {
    emailed = await sendEmail({
      subject: m.subject(reference),
      text: `${commerce.order.number(reference)}\n\n${body}`,
      replyTo: v.email || undefined,
    });
    if (emailed && v.email) {
      // The store copy is what matters; a failed customer copy does not fail the order.
      await sendEmail({
        to: v.email,
        subject: m.customerSubject(reference),
        text: `${m.customerIntro}\n\n${commerce.order.number(reference)}\n\n${body}`,
      });
    }
  }

  const whatsappUrl = `${chrome.whatsappHref}?text=${encodeURIComponent(
    `${m.greeting(reference)}\n\n${body}`,
  )}`;
  return { status: "placed", reference, order, emailed, whatsappUrl };
}
