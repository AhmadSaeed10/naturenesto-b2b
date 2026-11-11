"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { admin } from "@/content/admin";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  /** Section keys this person may open; the rest are shown as coming soon. */
  allowed: readonly string[];
  roleLabel: string;
  email: string;
  /** Product search, for roles that manage the catalogue. */
  showSearch: boolean;
  signOut: () => Promise<void>;
}

const LINK =
  "flex min-h-(--size-tap) items-center justify-between rounded-xl px-3 text-sm transition-colors duration-(--duration-micro) ease-brand";

function isActive(pathname: string, href: string): boolean {
  return href === "/admin"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar({
  allowed,
  roleLabel,
  email,
  showSearch,
  signOut,
}: AdminSidebarProps) {
  const pathname = usePathname();
  // The menu remembers the page it was opened on, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (value: boolean) => setOpenOn(value ? pathname : null);
  const navId = useId();
  const copy = admin.shell;

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenOn(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="border-b border-line bg-background lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:border-r lg:border-b-0">
      <div className="flex items-center justify-between gap-4 px-4 py-3 lg:px-5 lg:py-6">
        <Link href="/admin" className="font-serif text-xl leading-none text-ink">
          {admin.brand}
        </Link>
        <button
          type="button"
          className="inline-flex size-(--size-tap) items-center justify-center rounded-xl text-ink lg:hidden"
          aria-expanded={open}
          aria-controls={navId}
          onClick={() => setOpen(!open)}
        >
          <Icon name={open ? "close" : "menu"} size={22} />
          <span className="sr-only">{open ? copy.closeMenu : copy.openMenu}</span>
        </button>
      </div>

      <div
        id={navId}
        className={cn(
          "flex-1 flex-col gap-6 overflow-y-auto px-3 pb-6 lg:flex",
          open ? "flex" : "hidden",
        )}
      >
        {showSearch ? (
          <form role="search" action="/admin/products" className="flex gap-2 px-1">
            <label htmlFor={`${navId}-search`} className="sr-only">
              {copy.search}
            </label>
            <input
              id={`${navId}-search`}
              name="q"
              type="search"
              placeholder={copy.search}
              className="min-h-(--size-tap) min-w-0 flex-1 rounded-pill border border-ink-muted bg-background px-4 text-sm"
            />
            <button type="submit" className="sr-only focus:not-sr-only">
              {copy.searchSubmit}
            </button>
          </form>
        ) : null}
        <nav aria-label={copy.nav}>
          <ul className="flex flex-col gap-0.5">
            {admin.sections.map((section) => {
              const href = "href" in section ? section.href : undefined;
              if (!href || !allowed.includes(section.key)) {
                return (
                  <li key={section.key}>
                    <span
                      className={cn(LINK, "cursor-not-allowed text-ink-muted opacity-60")}
                      aria-disabled="true"
                    >
                      {section.label}
                      {!href ? (
                        <span className="rounded-pill border border-line px-2 text-xs">
                          {copy.soon}
                        </span>
                      ) : null}
                    </span>
                  </li>
                );
              }
              const active = isActive(pathname, href);
              return (
                <li key={section.key}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      LINK,
                      active
                        ? "bg-surface font-medium text-primary-dark"
                        : "text-ink hover:bg-surface",
                    )}
                  >
                    {section.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-auto flex flex-col gap-3 border-t border-line px-3 pt-4 text-sm">
          <p className="flex flex-col">
            <span className="break-all text-ink">{email}</span>
            <span className="text-ink-muted">{roleLabel}</span>
          </p>
          <div className="flex flex-wrap gap-x-4">
            <Link
              href="/"
              className="inline-flex min-h-(--size-tap) items-center text-primary-dark underline-offset-4 hover:underline"
            >
              {copy.viewSite}
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="inline-flex min-h-(--size-tap) items-center text-primary-dark underline-offset-4 hover:underline"
              >
                {copy.signOut}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
