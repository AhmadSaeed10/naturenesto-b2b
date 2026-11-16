import type { PhotoKey } from "./photos";

// Five solution areas from the marketplace strategy. Copy is drafted for the rebuild, not
// supplied by the client. (inferred) Confirm scope, wording and what the studio really offers.
export const SOLUTIONS_FLAG =
  "(inferred) Solution scope and copy drafted from the strategy chat. Client to confirm.";

export interface Solution {
  slug: string;
  title: string;
  short: string;
  intro: string;
  offers: string[];
  photo: PhotoKey;
  photoAlt: string;
}

export const solutionsPage = {
  eyebrow: "OUR SOLUTIONS",
  title: "Beautiful Spaces. Thoughtful Solutions.",
  intro:
    "From residential gardens to commercial landscapes, we create environments that bring functionality, beauty and nature together.",
  offersEyebrow: "WHAT WE DO",
  offersTitle: "What is included",
  moreEyebrow: "MORE SOLUTIONS",
  moreTitle: "Explore other solutions",
  studioTitle: "Studio services",
  studioBody: "Looking for styling, gifting or customization? See the studio's everyday services.",
  studioCta: { label: "View studio services", href: "/services" },
  process: {
    eyebrow: "HOW WE WORK",
    title: "From first visit to finished space",
    steps: [
      {
        title: "Consultation",
        body: "We visit or talk through the space, light, budget and how you live in it.",
      },
      {
        title: "Concept",
        body: "You receive a plan with plants, materials and a clear quotation.",
      },
      { title: "Installation", body: "Our team plants, builds and styles, and cleans up after." },
      {
        title: "Care",
        body: "Optional maintenance keeps everything healthy and looking its best.",
      },
    ],
  },
  cta: {
    title: "Start your project",
    body: "Tell us about the space and we will suggest where to begin.",
    primary: { label: "Book a Consultation", href: "/consultation" },
    secondary: { label: "See our projects", href: "/projects" },
  },
};

export const solutions: Solution[] = [
  {
    slug: "landscape-design",
    title: "Landscape Design & Development",
    short: "Gardens, terraces and outdoor spaces designed and built end to end.",
    intro:
      "Residential and commercial landscapes planned around your plot, climate and lifestyle, then built by one accountable team.",
    offers: [
      "Residential landscaping",
      "Commercial landscaping",
      "Garden design",
      "Rooftop landscaping",
      "Terrace and balcony gardens",
      "Vertical gardens",
      "Outdoor space transformation",
    ],
    photo: "bougain-a",
    photoAlt: "Bougainvillea in bloom beside a terrace",
  },
  {
    slug: "gardening-plantation",
    title: "Gardening & Plantation",
    short: "Planting, lawns and ongoing care that keep a garden thriving.",
    intro:
      "Whether you need a fresh planting plan or someone to look after an existing garden, our gardeners handle it with care.",
    offers: [
      "Professional gardening",
      "Garden maintenance",
      "Indoor plantation",
      "Outdoor plantation",
      "Seasonal plantation",
      "Lawn development",
      "Plant care and maintenance",
    ],
    photo: "potting",
    photoAlt: "Potting soil and plants ready for planting",
  },
  {
    slug: "space-planning",
    title: "Space Planning & Green Design",
    short: "Plant and pot plans for homes, offices, cafes and hotels.",
    intro:
      "We read the light and layout of a space, then plan the greenery that suits it and the people who use it.",
    offers: [
      "Residential space planning",
      "Commercial space planning",
      "Office green solutions",
      "Cafe and restaurant green spaces",
      "Hotel and hospitality landscaping",
      "Indoor green styling",
    ],
    photo: "room-plants-b",
    photoAlt: "A living room corner styled with large leafy plants",
  },
  {
    slug: "water-features",
    title: "Water Features & Aquatic Design",
    short: "Fountains, waterfalls and ponds, with aquariums to follow.",
    intro:
      "Moving water changes how a space feels. We design decorative features that fit the garden and the budget.",
    offers: [
      "Custom waterfall design",
      "Decorative water features",
      "Garden fountains",
      "Custom fish ponds",
      "Aquatic landscape design",
      "Aquarium design and installation (coming soon)",
    ],
    photo: "table-plants",
    photoAlt: "Plants grouped around a calm tabletop display",
  },
  {
    slug: "custom-design",
    title: "Custom Design & Installation",
    short: "Made to measure planters, green walls and outdoor living spaces.",
    intro:
      "When nothing off the shelf fits, we design and build it: planters, structures and finishing pieces made for your space.",
    offers: [
      "Custom planters",
      "Garden structures",
      "Outdoor living spaces",
      "Green walls",
      "Customized nature projects",
    ],
    photo: "terracotta-stack",
    photoAlt: "Stacked terracotta planters in warm light",
  },
];
