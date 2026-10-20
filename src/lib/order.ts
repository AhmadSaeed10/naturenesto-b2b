import type { CartProduct } from "@/lib/catalog";

// Order pricing shared by the checkout (preview) and the order action (authoritative).
// Prices are whole rupees.

export const DELIVERY_ZONES = ["lahore", "punjab", "pakistan"] as const;
export type DeliveryZone = (typeof DELIVERY_ZONES)[number];
export const isDeliveryZone = (value: unknown): value is DeliveryZone =>
  (DELIVERY_ZONES as readonly unknown[]).includes(value);

export interface DeliveryRates {
  lahore: number;
  punjab: number;
  pakistan: number;
  /** Subtotal at or above which delivery is free; null when there is no threshold. */
  freeOver: number | null;
}

export interface PricedLine {
  handle: string;
  name: string;
  size: string | null;
  image: string;
  price: number;
  quantity: number;
  lineTotal: number;
}

export interface PricedOrder {
  lines: PricedLine[];
  /** Handles in the cart that are unknown or out of stock. */
  unavailable: string[];
  subtotal: number;
  /** Null until a delivery area is chosen. */
  delivery: number | null;
  total: number;
}

export function priceOrder(
  cart: readonly { handle: string; quantity: number }[],
  catalog: Readonly<Record<string, CartProduct>>,
  rates: DeliveryRates,
  zone: DeliveryZone | null,
): PricedOrder {
  const lines: PricedLine[] = [];
  const unavailable: string[] = [];
  for (const { handle, quantity } of cart) {
    const product = catalog[handle];
    if (!product || !product.inStock) {
      unavailable.push(handle);
      continue;
    }
    lines.push({
      handle,
      name: product.name,
      size: product.size,
      image: product.image,
      price: product.price,
      quantity,
      lineTotal: product.price * quantity,
    });
  }
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const free = rates.freeOver !== null && subtotal >= rates.freeOver;
  const delivery = zone === null ? null : free ? 0 : rates[zone];
  return { lines, unavailable, subtotal, delivery, total: subtotal + (delivery ?? 0) };
}

/** A cart larger than this is refused; real orders that big go through bulk pricing. */
export const MAX_ORDER_LINES = 50;
