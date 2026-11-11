import {
  contentStatus,
  discountKind,
  fulfillmentStatus,
  leadSource,
  leadStatus,
  orderStatus,
  pageSectionType,
  paymentStatus,
  productStatus,
  quoteStatus,
  staffRole,
  stockReason,
} from "./schema";

/** JSON column value, as stored in Postgres jsonb. */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

/** Database enum values, for zod schemas and form options. */
export const ENUMS = {
  content_status: contentStatus.enumValues,
  discount_kind: discountKind.enumValues,
  fulfillment_status: fulfillmentStatus.enumValues,
  lead_source: leadSource.enumValues,
  lead_status: leadStatus.enumValues,
  order_status: orderStatus.enumValues,
  page_section_type: pageSectionType.enumValues,
  payment_status: paymentStatus.enumValues,
  product_status: productStatus.enumValues,
  quote_status: quoteStatus.enumValues,
  staff_role: staffRole.enumValues,
  stock_reason: stockReason.enumValues,
} as const;

export type Enums<K extends keyof typeof ENUMS> = (typeof ENUMS)[K][number];
