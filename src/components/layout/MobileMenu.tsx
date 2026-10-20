"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import type { Cta, NavLink as NavLinkData, SocialLink } from "@/content/types";
import { ui } from "@/content/ui";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/ui/Logo";
import { NavLink } from "@/components/ui/NavLink";
import { SocialLinks } from "@/components/ui/SocialLinks";

interface MobileMenuProps {
  shop: { label: string; links: readonly NavLinkData[] };
  links: readonly NavLinkData[];
  cta: Cta;
  socials: readonly SocialLink[];
}

// Native <dialog> with showModal() provides the focus trap, Escape handling, inert
// background and focus return to the trigger.
export function MobileMenu({ shop, links, cta, socials }: MobileMenuProps) {
  const shopHeadingId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
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
            <Logo />
            <button
              type="button"
              onClick={hide}
              aria-label={ui.menuClose}
              className="inline-flex size-(--size-tap) items-center justify-center rounded-pill border border-ink/30 transition-colors duration-(--duration-micro) ease-brand hover:border-ink"
            >
              <Icon name="close" />
            </button>
          </div>

          <nav aria-label={ui.primaryNav} className="mt-10 flex flex-col gap-8">
            {shop.links.length ? (
              <div>
                <p id={shopHeadingId} className="mb-2 eyebrow text-ink-muted">
                  {shop.label}
                </p>
                <ul aria-labelledby={shopHeadingId} className="grid grid-cols-2 gap-x-4">
                  {shop.links.map((link) => (
                    <li key={link.href}>
                      <NavLink href={link.href} onNavigate={hide}>
                        {link.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <ul className="flex flex-col gap-1">
              {links.map((link) => (
                <li key={link.href}>
                  <NavLink href={link.href} onNavigate={hide} className="font-serif text-h3">
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
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
