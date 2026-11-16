"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import { NavLink } from "@/components/ui/NavLink";
import type { NavGroup } from "@/content/types";
import { ui } from "@/content/ui";
import { cn } from "@/lib/utils";

interface NavMenuProps {
  groups: readonly NavGroup[];
}

const CLOSE_DELAY = 140;

/**
 * Desktop navigation. A group's label is a link to its hub page; the chevron button opens the
 * dropdown, which also opens on pointer hover and keyboard focus. Escape closes it.
 */
export function NavMenu({ groups }: NavMenuProps) {
  const [open, setOpen] = useState<string | null>(null);
  const pathname = usePathname();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const root = useRef<HTMLUListElement>(null);

  const cancel = () => {
    if (timer.current) clearTimeout(timer.current);
  };
  const later = () => {
    cancel();
    timer.current = setTimeout(() => setOpen(null), CLOSE_DELAY);
  };

  // Close on navigation: adjust state during render rather than in an effect.
  const [seenPath, setSeenPath] = useState(pathname);
  if (seenPath !== pathname) {
    setSeenPath(pathname);
    setOpen(null);
  }

  useEffect(() => {
    const onDown = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(null);
    };
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      cancel();
    };
  }, []);

  const onKey = (event: KeyboardEvent<HTMLLIElement>, label: string) => {
    if (event.key !== "Escape" || open !== label) return;
    setOpen(null);
    event.currentTarget.querySelector<HTMLElement>("[data-trigger]")?.focus();
  };

  return (
    <ul ref={root} className="flex items-center gap-5 2xl:gap-7">
      {groups.map((group) => {
        const columns = group.columns;
        if (!columns) {
          return (
            <li key={group.label}>
              <NavLink href={group.href}>{group.label}</NavLink>
            </li>
          );
        }
        const expanded = open === group.label;
        const panelId = `nav-panel-${group.label.toLowerCase()}`;
        return (
          <li
            key={group.label}
            className="relative"
            onPointerEnter={(event) => {
              if (event.pointerType !== "mouse") return;
              cancel();
              setOpen(group.label);
            }}
            onPointerLeave={(event) => {
              if (event.pointerType === "mouse") later();
            }}
            onKeyDown={(event) => onKey(event, group.label)}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setOpen(null);
            }}
          >
            <div className="flex items-center">
              <NavLink href={group.href}>{group.label}</NavLink>
              <button
                type="button"
                data-trigger
                aria-expanded={expanded}
                aria-controls={panelId}
                aria-label={ui.header.openGroup(group.label)}
                onClick={() => setOpen(expanded ? null : group.label)}
                className="inline-flex size-8 items-center justify-center text-ink"
              >
                <Icon
                  name="chevron-down"
                  size={16}
                  className={cn(
                    "transition-transform duration-(--duration-micro) ease-brand",
                    expanded && "rotate-180",
                  )}
                />
              </button>
            </div>
            <div
              id={panelId}
              hidden={!expanded}
              className="absolute top-full left-1/2 z-50 -translate-x-1/2 pt-3"
            >
              <div className="grain flex gap-10 rounded-card border border-line bg-background p-6 shadow-[0_12px_32px_-16px_color-mix(in_srgb,var(--color-ink)_35%,transparent)]">
                {columns.map((column) => (
                  <div key={column.heading} className="flex min-w-48 flex-col gap-3">
                    <p className="border-b border-line pb-2 eyebrow text-ink-muted">
                      {column.heading}
                    </p>
                    <ul className="flex flex-col">
                      {column.items.map((item) => (
                        <li key={item.label}>
                          {item.href ? (
                            <Link
                              href={item.href}
                              className="inline-flex min-h-(--size-tap) items-center text-small text-ink transition-colors duration-(--duration-micro) ease-brand hover:text-primary-dark"
                            >
                              {item.label}
                            </Link>
                          ) : (
                            <span className="inline-flex min-h-(--size-tap) items-center gap-2 text-small text-ink-muted">
                              {item.label}
                              <span className="rounded-pill border border-line px-2 py-0.5 eyebrow">
                                {ui.header.comingSoon}
                              </span>
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
