"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import type { NavLink as NavLinkData } from "@/content/types";
import { cn } from "@/lib/utils";

interface ShopMenuProps {
  label: string;
  links: readonly NavLinkData[];
}

/**
 * Desktop "Shop" disclosure listing every category. A disclosure (button plus list of
 * links), not an ARIA menu: links stay links, Tab moves through them, Escape closes.
 */
export function ShopMenu({ label, links }: ShopMenuProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const active = links.some(
    (link) => pathname === link.href || pathname.startsWith(`${link.href}/`),
  );

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape" && open) {
      setOpen(false);
      button.current?.focus();
    }
  };

  return (
    <div
      ref={root}
      className="relative"
      onKeyDown={onKeyDown}
      onBlur={(event) => {
        // Close once focus leaves the whole widget, so Tab never strands an open panel.
        if (!root.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "relative inline-flex min-h-(--size-tap) items-center gap-1 text-ink",
          "after:absolute after:inset-x-0 after:bottom-2.5 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-(--duration-micro) after:ease-brand after:content-['']",
          "hover:after:scale-x-100 focus-visible:after:scale-x-100 aria-expanded:after:scale-x-100",
          active && "text-primary-dark after:scale-x-100",
        )}
      >
        {label}
        <Icon
          name="chevron-down"
          size={16}
          className={cn(
            "transition-transform duration-(--duration-micro) ease-brand",
            open && "rotate-180",
          )}
        />
      </button>
      <div
        id={panelId}
        hidden={!open}
        className="absolute top-full left-1/2 z-50 mt-2 w-72 -translate-x-1/2 rounded-card border border-line bg-background p-3 shadow-soft"
      >
        <ul className="flex flex-col">
          {links.map((link) => {
            const current = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={current ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className="flex min-h-(--size-tap) items-center rounded-2xl px-4 text-ink transition-colors duration-(--duration-micro) ease-brand hover:bg-surface aria-[current=page]:text-primary-dark"
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
