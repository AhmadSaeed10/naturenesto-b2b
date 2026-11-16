import { services } from "./services";
import { site } from "./site";
import { solutions } from "./solutions";
import type { Cta, FooterColumn, NavGroup, NavLink } from "./types";

const INFERRED = "Inferred from an earlier fetch, not from the pasted copy.";

export const headerNav: NavLink[] = [
  { label: "Pots & Planters", href: "/pots-and-planters", flag: INFERRED },
  { label: "Indoor Plants", href: "/indoor-plants", flag: INFERRED },
  { label: "Outdoor Plants", href: "/outdoor-plants", flag: INFERRED },
  { label: "Services", href: "/services" },
  { label: "Contact", href: "/contact", flag: INFERRED },
];

// Marketplace navigation from the strategy chat. (inferred) Labels and grouping are drafted
// for the rebuild; the old flat list above stays in the CMS menu data for the footer and admin.
export const headerGroups: NavGroup[] = [
  {
    label: "Discover",
    href: "/shop",
    columns: [
      {
        heading: "Plants & Plantation",
        items: [
          { label: "Indoor Plants", href: "/indoor-plants" },
          { label: "Outdoor Plants", href: "/outdoor-plants" },
          { label: "Pet Friendly", href: "/plants/pet-friendly" },
          { label: "Easy Care", href: "/plants/easy-care" },
          { label: "Orchids", href: "/plants/orchids" },
          { label: "Large Plants", href: "/plants/large-plants" },
          { label: "Low Light", href: "/plants/low-light" },
        ],
      },
      {
        heading: "Pots & Garden",
        items: [
          { label: "Pots & Planters", href: "/pots-and-planters" },
          { label: "Plant Care", href: "/plants/plant-care" },
          { label: "Gardening Essentials", href: "/plants/plant-care" },
        ],
      },
      {
        heading: "Coming soon",
        items: [
          { label: "Water & Aquatic Living", soon: true },
          { label: "Birds & Nature", soon: true },
        ],
      },
    ],
  },
  {
    label: "Solutions",
    href: "/solutions",
    columns: [
      {
        heading: "Our Solutions",
        items: solutions.map((item) => ({ label: item.title, href: `/solutions/${item.slug}` })),
      },
      {
        heading: "Studio",
        items: [
          { label: "Studio services", href: "/services" },
          { label: "Workshops", href: "/workshops" },
          { label: "Book a consultation", href: "/consultation" },
        ],
      },
    ],
  },
  {
    label: "Marketplace",
    href: "/marketplace",
    columns: [
      {
        heading: "Shop",
        items: [
          { label: "All Products", href: "/shop" },
          { label: "Best Sellers", href: "/marketplace#best-sellers" },
          { label: "New Arrivals", href: "/marketplace#new-arrivals" },
          { label: "Special Offers", href: "/marketplace#offers" },
        ],
      },
      {
        heading: "Shop by Space",
        items: [
          { label: "Home & Living", href: "/spaces/home-living" },
          { label: "Balconies & Terraces", href: "/spaces/balconies-terraces" },
          { label: "Gardens & Lawns", href: "/spaces/gardens-lawns" },
          { label: "Rooftops", href: "/spaces/rooftops" },
          { label: "Offices & Workspaces", href: "/spaces/offices-workspaces" },
        ],
      },
    ],
  },
  { label: "Projects", href: "/projects" },
  { label: "Contact", href: "/contact" },
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
