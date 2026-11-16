// Homepage copy from the strategy chat ("Where Nature Meets Living"). (inferred) Wording drafted
// for the rebuild, client to confirm. These sections are code driven, not editable in admin yet.
export const HOME_WORLD_FLAG = "(inferred) Drafted from the strategy chat. Client to confirm.";

export const homeHero = {
  headline: "Where Nature Meets Living.",
  subline: "Welcome to Nature Nesto",
  secondary:
    "Plants, landscapes, gardens and thoughtful nature solutions, all in one place. Everything you need to bring nature into your space.",
  primary: { label: "Explore Marketplace", href: "/marketplace" },
  second: { label: "Discover Our Solutions", href: "/solutions" },
};

export const homeIntro = {
  eyebrow: "ABOUT NATURE NESTO",
  title: "More Than Nature. A Complete Living Experience.",
  paragraphs: [
    "Nature Nesto brings together plants, landscaping, gardening and design in one place. We help you create spaces that feel beautiful, calm and alive.",
    "Whether it is a single plant for your desk or a full garden for your home, we take care of the thinking so you can enjoy the result.",
  ],
  cta: { label: "Discover Nature Nesto", href: "/our-story" },
  photo: "room-plants-b" as const,
  photoAlt: "A bright living room with plants on a shelf and floor",
};

export const homeWorld = {
  eyebrow: "EXPLORE OUR WORLD",
  title: "Everything Nature, in One Place.",
  tiles: [
    {
      title: "Plants & Plantation",
      body: "Indoor, outdoor and easy care plants for every light.",
      href: "/shop",
      photo: "monstera-pot" as const,
      alt: "A monstera in a pot",
    },
    {
      title: "Landscape Design",
      body: "Gardens, terraces and outdoor spaces designed end to end.",
      href: "/solutions/landscape-design",
      photo: "olive-a" as const,
      alt: "An olive tree in a garden",
    },
    {
      title: "Pots & Planters",
      body: "Ceramic, terracotta and statement planters.",
      href: "/pots-and-planters",
      photo: "terracotta-stack" as const,
      alt: "Stacked terracotta pots",
    },
    {
      title: "Gardening Solutions",
      body: "Soil, tools and care for a garden that keeps thriving.",
      href: "/solutions/gardening-plantation",
      photo: "potting" as const,
      alt: "Potting a plant with soil and tools",
    },
    {
      title: "Water & Aquatic Living",
      body: "Water features and aquatic design.",
      photo: "table-plants" as const,
      alt: "Plants grouped on a wooden table",
    },
    {
      title: "Birds & Nature",
      body: "Bird friendly gardens and accessories.",
      photo: "bird-a" as const,
      alt: "A bird of paradise plant",
    },
  ],
};

export const homeSolutions = {
  eyebrow: "OUR SOLUTIONS",
  title: "Beautiful Spaces. Thoughtful Solutions.",
  intro:
    "From residential gardens to commercial landscapes, we create environments that bring functionality, beauty and nature together.",
  cta: { label: "Explore All Solutions", href: "/solutions" },
};

export const homeMarketplace = {
  eyebrow: "NATURE MARKETPLACE",
  title: "Your Nature Shopping Destination.",
  body: "From a single indoor plant to a complete garden transformation, find everything you need in one place.",
  cta: { label: "Shop Now", href: "/marketplace" },
  photo: "room-plants-a" as const,
  photoAlt: "A living room filled with plants",
};

export const homeSpaces = {
  eyebrow: "SHOP BY SPACE",
  title: "Find Something Beautiful for Every Space.",
  cta: { label: "Explore the Marketplace", href: "/marketplace" },
};

export const homeProjects = {
  eyebrow: "FEATURED PROJECTS",
  title: "From Vision to Nature.",
  intro: "A look at spaces we have shaped, from private gardens to commercial landscapes.",
  cta: { label: "Explore Our Projects", href: "/projects" },
  slugs: ["dha-courtyard-garden", "paragon-rooftop-terrace", "cafe-green-corner"],
};

export const homeWhy = {
  eyebrow: "WHY NATURE NESTO",
  title: "Bringing Everything Nature Together.",
  items: [
    {
      title: "One Destination",
      body: "Plants, planters, landscaping and design in a single place.",
    },
    {
      title: "Design Led Approach",
      body: "Every space is planned around how you live and what it needs.",
    },
    {
      title: "Expert Guidance",
      body: "Honest advice from people who work with plants every day.",
    },
    {
      title: "Complete Solutions",
      body: "From first idea to finished space, we stay with you.",
    },
  ],
};

export const homeFinal = {
  title: "Let's Create Something Naturally Beautiful.",
  body: "Tell us about your space and we will help you shape it.",
  primary: { label: "Start Your Project", href: "/contact" },
  secondary: { label: "Explore Marketplace", href: "/marketplace" },
};
