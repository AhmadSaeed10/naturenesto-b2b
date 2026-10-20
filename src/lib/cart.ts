"use client";

import { useSyncExternalStore } from "react";

// The cart lives in this browser's localStorage: handles and quantities only. Names and
// prices always come from the catalogue, and the server re-prices every order.

export interface CartLine {
  handle: string;
  quantity: number;
}

export const MAX_QUANTITY = 99;
const KEY = "nn_cart_v1";
const EVENT = "nn:cart";
const EMPTY: CartLine[] = [];

let cache: { raw: string | null; lines: CartLine[] } = { raw: null, lines: EMPTY };

const isLine = (value: unknown): value is CartLine =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as CartLine).handle === "string" &&
  Number.isInteger((value as CartLine).quantity) &&
  (value as CartLine).quantity > 0;

function read(): CartLine[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    // Storage blocked (private mode, policy): the cart simply stays empty.
  }
  if (raw === cache.raw) return cache.lines;
  let lines = EMPTY;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) lines = parsed.filter(isLine);
  } catch {
    lines = EMPTY;
  }
  // Same snapshot object until the stored value changes, as useSyncExternalStore needs.
  cache = { raw, lines };
  return lines;
}

function write(lines: CartLine[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    // Ignored for the same reason as in read().
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  // "storage" keeps other tabs in sync; the custom event covers this tab.
  window.addEventListener("storage", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

const clamp = (n: number) => Math.max(0, Math.min(MAX_QUANTITY, Math.floor(n)));

export function addToCart(handle: string, quantity: number) {
  const lines = read();
  const existing = lines.find((line) => line.handle === handle);
  const next = clamp((existing?.quantity ?? 0) + quantity);
  write(
    existing
      ? lines.map((line) => (line.handle === handle ? { ...line, quantity: next } : line))
      : [...lines, { handle, quantity: next }],
  );
}

/** Sets a line's quantity; 0 removes it. */
export function setCartQuantity(handle: string, quantity: number) {
  const next = clamp(quantity);
  write(
    next === 0
      ? read().filter((line) => line.handle !== handle)
      : read().map((line) => (line.handle === handle ? { ...line, quantity: next } : line)),
  );
}

export function clearCart() {
  write([]);
}

/** Cart lines, or null during server render and hydration (storage is unknown there). */
export function useCart(): CartLine[] | null {
  return useSyncExternalStore<CartLine[] | null>(subscribe, read, () => null);
}

export const cartCount = (lines: CartLine[] | null): number =>
  (lines ?? []).reduce((sum, line) => sum + line.quantity, 0);
