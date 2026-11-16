import Link from "next/link";
import { headerCta as defaultCta, headerGroups } from "@/content/nav";
import { site } from "@/content/site";
import type { Cta, SocialLink } from "@/content/types";
import { ui } from "@/content/ui";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { Icon } from "@/components/ui/Icon";
import { HeaderScroll } from "./HeaderScroll";
import { CartIndicator } from "@/components/shop/CartIndicator";
import { HeaderSearch } from "./HeaderSearch";
import { MobileMenu } from "./MobileMenu";
import { NavMenu } from "./NavMenu";
import { WishlistLink } from "./WishlistLink";

export const HEADER_ID = "site-header";
export const HEADER_HOME_LINK_ID = "site-header-home";

interface HeaderProps {
  cta?: Cta;
  socials?: SocialLink[];
}

export function Header({ cta: headerCta = defaultCta, socials = [...site.socials] }: HeaderProps) {
  return (
    <header
      id={HEADER_ID}
      className="group/header sticky top-0 z-40 transition-transform duration-(--duration-reveal) ease-brand data-[hidden=true]:not-focus-within:-translate-y-full"
    >
      <HeaderScroll targetId={HEADER_ID} />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 border-b border-line bg-background/85 opacity-0 backdrop-blur-md transition-opacity duration-(--duration-micro) ease-brand group-data-[scrolled=true]/header:opacity-100"
      />
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-6 px-4 md:px-8">
        <Link
          id={HEADER_HOME_LINK_ID}
          href="/"
          aria-label={ui.homeLink}
          className="inline-flex min-h-(--size-tap) items-center"
        >
          <Logo className="origin-left transition-transform duration-(--duration-reveal) ease-brand group-data-[scrolled=true]/header:scale-[0.85]" />
        </Link>

        <nav aria-label={ui.primaryNav} className="hidden xl:block">
          <NavMenu groups={headerGroups} />
        </nav>

        <div className="flex items-center gap-2">
          {/* Wrapper owns visibility: Button sets its own display. */}
          <div className="hidden sm:block">
            <Button href={headerCta.href} withArrow>
              {headerCta.label}
            </Button>
          </div>
          <HeaderSearch />
          <Link
            href="/account"
            aria-label={ui.header.account}
            className="hidden size-(--size-tap) items-center justify-center rounded-pill text-ink transition-colors duration-(--duration-micro) hover:bg-surface sm:inline-flex"
          >
            <Icon name="user" size={22} />
          </Link>
          <WishlistLink />
          <CartIndicator />
          <MobileMenu groups={headerGroups} cta={headerCta} socials={socials} />
        </div>
      </div>
    </header>
  );
}
