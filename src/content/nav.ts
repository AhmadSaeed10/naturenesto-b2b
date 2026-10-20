import { services } from "./services";
import { site } from "./site";
import type { Cta, FooterColumn, NavLink } from "./types";

const INFERRED = "Inferred from an earlier fetch, not from the pasted copy.";

// Header shop menu: lists every catalogue category (built in src/lib/cms/data.ts).
export const shopMenu = { label: "Shop" };

// Links after the Shop menu. Pots & Planters, Indoor and Outdoor Plants moved into it.
export const headerNav: NavLink[] = [
  { label: "Services", href: "/services" },
  { label: "About Us", href: "/about", flag: INFERRED },
  { label: "Contact", href: "/contact", flag: INFERRED },
];

export const headerCta: Cta = { label: "Book a Consultation", href: "/consultation" };

export const footerColumns: FooterColumn[] = [
  {
    heading: "SERVICES",
    links: services.map(({ title, href }) => ({ label: title, href })),
  },
  {
    heading: "CUSTOMER SERVICES",
    links: [
      { label: "FAQ", href: "/faq" },
      { label: "Shipping & Handling", href: "/shipping" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
  {
    heading: "Explore",
    links: [
      { label: "Our Story", href: "/our-story" },
      { label: "Career", href: "/careers" },
      { label: "Workshops", href: "/workshops" },
      { label: "Blogs", href: "/blogs" },
      { label: "About Us", href: "/about", flag: INFERRED },
      { label: "Work Place Policy", href: "/workplace-policy", flag: INFERRED },
    ],
  },
];

export const footerVisit = {
  heading: "VISIT US",
  address: site.address,
};
