import Link from "next/link";
import { footerColumns as defaultColumns, footerVisit } from "@/content/nav";
import { site } from "@/content/site";
import type { FooterColumn, SocialLink } from "@/content/types";
import { ui } from "@/content/ui";
import { Logo } from "@/components/ui/Logo";
import { SocialLinks } from "@/components/ui/SocialLinks";

const LINK =
  "relative inline-flex min-h-(--size-tap) items-center text-background after:absolute after:inset-x-0 after:bottom-2.5 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-(--duration-micro) after:ease-brand after:content-[''] hover:after:scale-x-100 focus-visible:after:scale-x-100";

const headingId = (heading: string): string =>
  `footer-${heading.toLowerCase().replace(/\s+/g, "-")}`;

interface FooterProps {
  columns?: FooterColumn[];
  address?: string;
  email?: string;
  socials?: SocialLink[];
  legal?: string;
}

export function Footer({
  columns: footerColumns = defaultColumns,
  address = footerVisit.address,
  email = site.email,
  socials = [...site.socials],
  legal = site.legal,
}: FooterProps) {
  return (
    // Focus ring switches to a light colour: primaryDark on ink is below 3:1.
    <footer className="grain bg-ink text-background [--focus-ring:var(--color-background)]">
      <div className="mx-auto max-w-7xl px-4 pt-16 pb-8 md:px-8 lg:pt-24">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-[1.2fr_repeat(3,1fr)]">
          <div className="flex flex-col gap-6">
            <Link
              href="/"
              aria-label={ui.homeLink}
              className="inline-flex min-h-(--size-tap) w-fit items-center"
            >
              <Logo tone="light" className="h-16 md:h-20" />
            </Link>
            <div>
              <h2 className="mb-3 eyebrow text-surface">{footerVisit.heading}</h2>
              <address className="max-w-xs text-small text-surface not-italic">{address}</address>
            </div>
            <a href={`mailto:${email}`} className={LINK}>
              {email}
            </a>
            <SocialLinks links={socials} className="-ml-3" />
          </div>

          {footerColumns.map((column) => (
            <nav key={column.heading} aria-labelledby={headingId(column.heading)}>
              <h2 id={headingId(column.heading)} className="mb-3 eyebrow text-surface">
                {column.heading}
              </h2>
              <ul>
                {column.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link href={link.href} className={LINK}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-16 border-t border-background/20 pt-6">
          <p className="text-small text-surface">{legal}</p>
        </div>
      </div>
    </footer>
  );
}
