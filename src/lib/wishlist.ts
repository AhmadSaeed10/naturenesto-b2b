"use client";

import { useCallback, useSyncExternalStore } from "react";

const KEY = "nn-wishlist";
const EVENT = "nn-wishlist-change";
const EMPTY: readonly string[] = [];

// The list is kept as one string so useSyncExternalStore sees a stable snapshot until it
// really changes. Storage can throw (private windows, blocked cookies), so every access is
// guarded and the wishlist simply works for the current page view.
let memory = "";

function read(): string {
  try {
    return window.localStorage.getItem(KEY) ?? memory;
  } catch {
    return memory;
  }
}

function write(handles: readonly string[]) {
  memory = JSON.stringify(handles);
  try {
    window.localStorage.setItem(KEY, memory);
  } catch {
    // Keep the in memory copy only.
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function parse(raw: string): readonly string[] {
  if (!raw) return EMPTY;
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string")
      : EMPTY;
  } catch {
    return EMPTY;
  }
}

export function useWishlist() {
  const raw = useSyncExternalStore(subscribe, read, () => "");
  const handles = parse(raw);
  const toggle = useCallback((handle: string) => {
    const current = parse(read());
    write(current.includes(handle) ? current.filter((h) => h !== handle) : [...current, handle]);
  }, []);
  return {
    handles,
    count: handles.length,
    has: (handle: string) => handles.includes(handle),
    toggle,
  };
}
