import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { FloatingWhatsApp } from "@/components/layout/FloatingWhatsApp";
import { Footer } from "@/components/layout/Footer";
import { HEADER_HOME_LINK_ID, Header } from "@/components/layout/Header";
import { SkipLink } from "@/components/layout/SkipLink";
import { CursorFollower } from "@/components/motion/CursorFollower";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { ui } from "@/content/ui";
import { MAIN_CONTENT_ID } from "@/lib/constants";
import { getSiteChrome } from "@/lib/cms/data";

// Storefront chrome, read from the Keystatic settings and navigation (src/content fallback).
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const chrome = await getSiteChrome();
  return (
    <MotionProvider>
      <SkipLink />
      {chrome.announcement.enabled ? (
        <AnnouncementBar
          message={chrome.announcement.message}
          socials={chrome.socials}
          focusTargetId={HEADER_HOME_LINK_ID}
        />
      ) : null}
      <Header
        shop={chrome.shopMenu}
        nav={chrome.headerNav}
        cta={chrome.headerCta}
        socials={chrome.socials}
      />
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
      <Footer
        columns={chrome.footerColumns}
        address={chrome.address}
        email={chrome.email}
        socials={chrome.socials}
        legal={chrome.legal}
      />
      <FloatingWhatsApp href={chrome.whatsappHref} label={ui.whatsappFloat} />
      <CursorFollower label={ui.cursorView} />
    </MotionProvider>
  );
}
