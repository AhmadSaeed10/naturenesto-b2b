"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { ui } from "@/content/ui";

export interface SearchItem {
  name: string;
  href: string;
  price: string;
  size?: string;
}

/** Header search: a native dialog with a live filter over product names. */
export function SearchDialog({ items }: { items: SearchItem[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState("");
  const id = useId();
  const pathname = usePathname();

  useEffect(() => {
    dialog.current?.close();
  }, [pathname]);

  const needle = query.trim().toLowerCase();
  const results = (
    needle ? items.filter((item) => item.name.toLowerCase().includes(needle)) : items
  ).slice(0, 8);

  return (
    <>
      <button
        type="button"
        aria-label={ui.header.search}
        aria-haspopup="dialog"
        onClick={() => dialog.current?.showModal()}
        className="inline-flex size-(--size-tap) items-center justify-center rounded-pill text-ink transition-colors duration-(--duration-micro) hover:bg-surface"
      >
        <Icon name="search" size={22} />
      </button>
      <dialog
        ref={dialog}
        aria-label={ui.search.title}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
        className="m-0 mx-auto mt-[10vh] w-[calc(100%-2rem)] max-w-xl rounded-card border border-line bg-background p-0 text-ink backdrop:bg-ink/40"
      >
        <div className="flex flex-col gap-4 p-5 md:p-6">
          <div className="flex items-center gap-3">
            <label htmlFor={`${id}-q`} className="sr-only">
              {ui.search.title}
            </label>
            <input
              id={`${id}-q`}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={ui.search.placeholder}
              autoFocus
              className="min-h-(--size-tap) w-full min-w-0 rounded-pill border border-ink/25 bg-background px-4"
            />
            <button
              type="button"
              aria-label={ui.search.close}
              onClick={() => dialog.current?.close()}
              className="inline-flex size-(--size-tap) shrink-0 items-center justify-center rounded-pill border border-ink/30 hover:border-ink"
            >
              <Icon name="close" />
            </button>
          </div>
          {results.length === 0 ? (
            <p className="py-4 text-ink-muted" aria-live="polite">
              {ui.search.none}
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-line">
              {results.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex min-h-(--size-tap) items-center justify-between gap-4 py-2 hover:text-primary-dark"
                  >
                    <span className="min-w-0">
                      <span className="block truncate">{item.name}</span>
                      {item.size ? (
                        <span className="block text-small text-ink-muted">{item.size}</span>
                      ) : null}
                    </span>
                    <span className="shrink-0 text-small text-ink-muted">{item.price}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/shop"
            className="inline-flex min-h-(--size-tap) items-center text-small text-primary-dark underline underline-offset-4"
          >
            {ui.search.all}
          </Link>
        </div>
      </dialog>
    </>
  );
}
