import type { PhotoKey } from "./photos";

// There are no real project case studies yet. Everything here is a placeholder so the layout
// can be reviewed. (inferred) Replace with real projects, photos and client permission before
// launch, or hide the Projects section.
export const PROJECTS_FLAG = "(inferred) Placeholder case studies. Replace with real projects.";

export type ProjectType = "Residential" | "Rooftop" | "Commercial" | "Cafe" | "Interior";

export interface Project {
  slug: string;
  title: string;
  location: string;
  type: ProjectType;
  summary: string;
  brief: string;
  concept: string;
  services: { label: string; href: string }[];
  photo: PhotoKey;
  after: PhotoKey;
  photoAlt: string;
  afterAlt: string;
}

export const projectsPage = {
  eyebrow: "PROJECTS",
  title: "From Vision to Nature.",
  intro:
    "Explore our creative transformations, thoughtfully designed landscapes and nature-inspired projects.",
  all: "All projects",
  briefLabel: "The brief",
  conceptLabel: "The concept",
  beforeLabel: "Before",
  afterLabel: "After",
  servicesLabel: "Related solutions",
  back: "All projects",
  cta: {
    title: "Have a space in mind?",
    body: "Share it with us and we will plan something naturally beautiful.",
    primary: { label: "Start Your Project", href: "/consultation" },
    secondary: { label: "Explore Marketplace", href: "/shop" },
  },
};

const landscape = { label: "Landscape design", href: "/solutions/landscape-design" };
const planning = { label: "Space planning", href: "/solutions/space-planning" };
const gardening = { label: "Gardening and plantation", href: "/solutions/gardening-plantation" };
const custom = { label: "Custom design", href: "/solutions/custom-design" };

export const projects: Project[] = [
  {
    slug: "dha-courtyard-garden",
    title: "Courtyard Garden",
    location: "DHA, Lahore",
    type: "Residential",
    summary: "A shaded family courtyard turned into a calm green retreat.",
    brief: "A bare courtyard with little shade and no planting, used mostly as a walkway.",
    concept:
      "Layered planting around a central seating area, with olive and flowering shrubs for year round colour.",
    services: [landscape, gardening],
    photo: "olive-a",
    after: "bougain-a",
    photoAlt: "An olive tree in an open garden space",
    afterAlt: "Bougainvillea in full bloom",
  },
  {
    slug: "paragon-rooftop-terrace",
    title: "Rooftop Terrace",
    location: "Paragon City, Lahore",
    type: "Rooftop",
    summary: "An exposed roof made usable with sun tolerant planting.",
    brief: "A hot concrete roof that nobody used for most of the year.",
    concept: "Heat tolerant plants in large planters, grouped to make shade and a place to sit.",
    services: [landscape, custom],
    photo: "terracotta-stack",
    after: "bird-a",
    photoAlt: "Stacked terracotta planters",
    afterAlt: "A bird of paradise plant in bright light",
  },
  {
    slug: "gulberg-office-greens",
    title: "Office Green Solutions",
    location: "Gulberg, Lahore",
    type: "Commercial",
    summary: "Low maintenance plants for an open plan office.",
    brief: "A bright but plain open office that needed warmth without a heavy care routine.",
    concept:
      "Hardy plants in matching planters along desks and meeting areas, with a simple care plan.",
    services: [planning, gardening],
    photo: "office",
    after: "desk-succulents",
    photoAlt: "Plants beside a desk in an office",
    afterAlt: "Small succulents lined up on a desk",
  },
  {
    slug: "cafe-green-corner",
    title: "Cafe Green Corner",
    location: "Lahore",
    type: "Cafe",
    summary: "A statement planting wall that became the cafe's photo spot.",
    brief: "A plain dining corner with no character and low natural light.",
    concept:
      "Large leaf plants and custom planters chosen for low light, grouped as a layered corner.",
    services: [planning, custom],
    photo: "table-plants",
    after: "fiddle-a",
    photoAlt: "Plants grouped on a wooden table",
    afterAlt: "A tall fiddle leaf fig by a window",
  },
  {
    slug: "balcony-garden",
    title: "Balcony Garden",
    location: "Bahria Town, Lahore",
    type: "Residential",
    summary: "A small apartment balcony turned into a herb and flower garden.",
    brief: "A narrow balcony with strong afternoon sun and almost no storage.",
    concept: "Vertical and rail planters with herbs, jasmine and lavender that suit the sun.",
    services: [landscape, gardening],
    photo: "herbs",
    after: "lavender",
    photoAlt: "Fresh herbs growing in pots",
    afterAlt: "Lavender in flower",
  },
  {
    slug: "living-room-styling",
    title: "Indoor Green Styling",
    location: "Gulberg, Lahore",
    type: "Interior",
    summary: "A living room refreshed with plants chosen for its light.",
    brief: "A new home that felt empty, with one bright window and a darker corner.",
    concept:
      "Statement plants in the bright spot, low light plants in the corner, tied together with matching pots.",
    services: [planning],
    photo: "room-plants-a",
    after: "room-plants-b",
    photoAlt: "A living room with plants on a shelf and floor",
    afterAlt: "A living room corner styled with large leafy plants",
  },
];
