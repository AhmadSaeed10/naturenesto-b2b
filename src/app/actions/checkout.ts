"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  type Quote,
  clearCartCookie,
  commerceEnabled,
  quoteCart,
  readCartToken,
} from "@/lib/commerce/cart";
import { RATE_LIMITS, clientIp, withinRateLimit } from "@/lib/rate-limit";
import { sql } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

const code = z.string().trim().max(32);
const city = z.string().trim().max(120);

/** Live totals for the checkout summary as the customer types city and code. */
export async function quoteCheckout(input: {
  discountCode: string;
  city: string;
  email: string;
}): Promise<Quote | null> {
  const parsed = z
    .object({ discountCode: code, city, email: z.string().trim().max(320) })
    .safeParse(input);
  if (!parsed.success) return null;
  return quoteCart(parsed.data);
}

const PLACE_ERRORS = [
  "unavailable",
  "discount_invalid",
  "discount_expired",
  "discount_min_subtotal",
  "discount_limit",
  "payment_method",
  "shipping_unavailable",
  "cart_empty",
  "cart_missing",
] as const;
type PlaceError = (typeof PLACE_ERRORS)[number];

export interface CheckoutState {
  status: "idle" | "invalid" | "error";
  error?: PlaceError | "rateLimited" | "failed";
  fields?: string[];
  values?: Record<string, string>;
}

const checkoutSchema = z.object({
  email: z.email().max(320),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s()-]{7,20}$/)
    .refine((value) => {
      const digits = value.replace(/\D/g, "").length;
      return digits >= 7 && digits <= 15;
    }),
  fullName: z.string().trim().min(2).max(200),
  line1: z.string().trim().min(3).max(300),
  line2: z.string().trim().max(300),
  area: z.string().trim().max(200),
  city: city.min(2),
  province: z.string().trim().max(120),
  postalCode: z.string().trim().max(20),
  notes: z.string().trim().max(1000),
  discountCode: code,
  paymentMethod: z.string().regex(/^[a-z_]{2,32}$/),
});

const FIELDS = Object.keys(checkoutSchema.shape) as (keyof typeof checkoutSchema.shape)[];

export async function placeOrder(
  _previous: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const values = Object.fromEntries(
    FIELDS.map((field) => [field, String(formData.get(field) ?? "")]),
  );
  if (!commerceEnabled()) return { status: "error", error: "failed", values };

  const parsed = checkoutSchema.safeParse(values);
  if (!parsed.success) {
    return {
      status: "invalid",
      fields: [...new Set(parsed.error.issues.map((issue) => String(issue.path[0])))],
      values,
    };
  }
  if (!(await withinRateLimit(RATE_LIMITS.checkout, await clientIp()))) {
    return { status: "error", error: "rateLimited", values };
  }
  const cartToken = await readCartToken();
  if (!cartToken) return { status: "error", error: "cart_empty", values };

  const v = parsed.data;
  const request = {
    cart_token: cartToken,
    user_id: (await getSessionUser())?.id ?? "",
    email: v.email,
    phone: v.phone,
    full_name: v.fullName,
    address: {
      full_name: v.fullName,
      phone: v.phone,
      line1: v.line1,
      line2: v.line2 || null,
      area: v.area || null,
      city: v.city,
      province: v.province || null,
      postal_code: v.postalCode || null,
      country: "PK",
    },
    notes: v.notes,
    discount_code: v.discountCode,
    payment_method: v.paymentMethod,
  };

  let data: unknown;
  try {
    // place_order prices, locks stock and writes the order in one database transaction. It
    // runs as the server (no actor), and reports business errors by message.
    const result = await db().execute<{ o: unknown }>(
      sql`select public.place_order(${JSON.stringify(request)}::jsonb) as o`,
    );
    data = result.rows[0]?.o;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const known = PLACE_ERRORS.find((key) => message === key || message.endsWith(key));
    if (!known) console.error("[checkout] place_order failed", message);
    return { status: "error", error: known ?? "failed", values };
  }

  const placed = z.object({ number: z.coerce.number(), access_token: z.uuid() }).safeParse(data);
  if (!placed.success) return { status: "error", error: "failed", values };
  await clearCartCookie();
  redirect(`/orders/${placed.data.number}?t=${placed.data.access_token}`);
}
