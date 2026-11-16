"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { Cta, NavGroup, SocialLink } from "@/content/types";
import { ui } from "@/content/ui";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { NavLink } from "@/components/ui/NavLink";
import { SocialLinks } from "@/components/ui/SocialLinks";

interface MobileMenuProps {
  groups: readonly NavGroup[];
  cta: Cta;
  socials: readonly SocialLink[];
}

// Native <dialog> with showModal() provides the focus trap, Escape handling, inert
// background and focus return to the trigger.
export function MobileMenu({ groups, cta, socials }: MobileMenuProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const pathname = usePathname();

  const show = () => {
    dialogRef.current?.showModal();
    setOpen(true);
  };
  const hide = () => dialogRef.current?.close();

  useEffect(() => {
    dialogRef.current?.close();
  }, [pathname]);

  // Native modal dialogs let Tab escape to the browser UI after the last control.
  // Wrapping keeps keyboard users cycling inside the menu, per the APG dialog pattern.
  const wrapFocus = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== "Tab") return;
    const focusable = event.currentTarget.querySelectorAll<HTMLElement>("a[href], button");
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={show}
        aria-label={ui.menuOpen}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="inline-flex size-(--size-tap) items-center justify-center rounded-pill border border-ink/30 text-ink transition-colors duration-(--duration-micro) ease-brand hover:border-ink xl:hidden"
      >
        <Icon name="menu" />
      </button>

      <dialog
        ref={dialogRef}
        aria-label={ui.menuTitle}
        onClose={() => setOpen(false)}
        onKeyDown={wrapFocus}
        onClick={(event) => {
          if (event.target === event.currentTarget) hide();
        }}
        className="m-0 h-dvh max-h-none w-full max-w-none translate-y-3 bg-background p-0 text-ink opacity-0 transition-[opacity,translate,overlay,display] transition-discrete duration-(--duration-reveal) ease-brand backdrop:bg-ink/40 open:translate-y-0 open:opacity-100 xl:hidden starting:open:translate-y-3 starting:open:opacity-0"
      >
        <div className="grain mx-auto flex min-h-full max-w-7xl flex-col px-4 pb-8 md:px-8">
          <div className="flex h-18 items-center justify-between">
            <Logo className="h-12" />
            <button
              type="button"
              onClick={hide}
              aria-label={ui.menuClose}
              className="inline-flex size-(--size-tap) items-center justify-center rounded-pill border border-ink/30 transition-colors duration-(--duration-micro) ease-brand hover:border-ink"
            >
              <Icon name="close" />
            </button>
          </div>

          <nav aria-label={ui.primaryNav} className="mt-10">
            <ul className="flex flex-col">
              {groups.map((group) => {
                const isOpen = expanded === group.label;
                return (
                  <li key={group.label} className="border-b border-line last:border-b-0">
                    <div className="flex items-center justify-between">
                      <NavLink href={group.href} onNavigate={hide} className="font-serif text-h3">
                        {group.label}
                      </NavLink>
                      {group.columns ? (
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          aria-label={ui.header.openGroup(group.label)}
                          onClick={() => setExpanded(isOpen ? null : group.label)}
                          className="inline-flex size-(--size-tap) items-center justify-center"
                        >
                          <Icon
                            name="chevron-down"
                            className={
                              isOpen ? "rotate-180 transition-transform" : "transition-transform"
                            }
                          />
                        </button>
                      ) : null}
                    </div>
                    {group.columns && isOpen ? (
                      <div className="flex flex-col gap-5 pb-5 pl-1">
                        {group.columns.map((column) => (
                          <div key={column.heading} className="flex flex-col">
                            <p className="pb-1 eyebrow text-ink-muted">{column.heading}</p>
                            {column.items.map((item) =>
                              item.href ? (
                                <NavLink
                                  key={item.label}
                                  href={item.href}
                                  onNavigate={hide}
                                  className="text-body"
                                >
                                  {item.label}
                                </NavLink>
                              ) : (
                                <span
                                  key={item.label}
                                  className="inline-flex min-h-(--size-tap) items-center gap-2 text-ink-muted"
                                >
                                  {item.label}
                                  <span className="rounded-pill border border-line px-2 py-0.5 eyebrow">
                                    {ui.header.comingSoon}
                                  </span>
                                </span>
                              ),
                            )}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 flex gap-2">
              <Link
                href="/wishlist"
                onClick={hide}
                aria-label={ui.header.wishlist(0)}
                className="inline-flex size-(--size-tap) items-center justify-center rounded-pill border border-ink/30"
              >
                <Icon name="heart" />
              </Link>
              <Link
                href="/account"
                onClick={hide}
                aria-label={ui.header.account}
                className="inline-flex size-(--size-tap) items-center justify-center rounded-pill border border-ink/30"
              >
                <Icon name="user" />
              </Link>
            </div>
          </nav>

          <div className="mt-auto flex flex-col gap-6 pt-10">
            <Button href={cta.href} withArrow className="w-full" onClick={hide}>
              {cta.label}
            </Button>
            <SocialLinks links={socials} className="-ml-3" />
          </div>
        </div>
      </dialog>
    </>
  );
}
