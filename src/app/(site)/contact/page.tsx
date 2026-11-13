import { EnquiryForm } from "@/components/forms/EnquiryForm";
import { EnquiryPage } from "@/components/forms/EnquiryPage";
import { forms } from "@/content/forms";
import { needHelp } from "@/content/home";
import { footerVisit } from "@/content/nav";
import { contactExtra } from "@/content/pages-extra";
import { site } from "@/content/site";
import { seo } from "@/content/seo";
import { pageMetadata } from "@/lib/seo";

const TITLE = "Contact";

export const metadata = pageMetadata({
  title: TITLE,
  description: seo.pageDescription(TITLE),
  path: "/contact",
});

const whatsapp = needHelp.channels.find((channel) => channel.kind === "whatsapp");

export default function ContactPage() {
  return (
    <EnquiryPage
      eyebrow={forms.pages.contactEyebrow}
      title={TITLE}
      intro={needHelp.body}
      aside={
        <ul className="grid gap-4 text-ink">
          {needHelp.channels.map((channel) => (
            <li key={channel.kind}>
              <p className="eyebrow text-ink-muted">{channel.label}</p>
              <a
                href={channel.href}
                className="inline-flex min-h-(--size-tap) items-center font-serif text-h4 text-ink underline-offset-4 hover:underline"
              >
                {channel.display}
              </a>
            </li>
          ))}
          <li>
            <p className="eyebrow text-ink-muted">{contactExtra.hoursLabel}</p>
            <p>{contactExtra.hours}</p>
            <p className="max-w-xs text-small text-ink-muted">{contactExtra.note}</p>
          </li>
          <li>
            <p className="eyebrow text-ink-muted">{footerVisit.heading}</p>
            <address className="max-w-xs not-italic">{footerVisit.address}</address>
          </li>
        </ul>
      }
    >
      <EnquiryForm kind="contact" whatsappHref={whatsapp?.href ?? ""} email={site.email} />
    </EnquiryPage>
  );
}
