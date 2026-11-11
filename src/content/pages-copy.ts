import { site } from "./site";

export interface PageImage {
  src: string;
  alt: string;
}
export interface PageCta {
  label: string;
  href: string;
}
export interface PolicySection {
  id: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
}

/** Every block below is drafted for the rebuild, not supplied by the client. */
export const DRAFT_FLAG = "(inferred) Drafted copy. Client to confirm before launch.";

const consult: PageCta = { label: "Book a Consultation", href: "/consultation" };
const contact: PageCta = { label: "Contact the studio", href: "/contact" };

export const aboutPage = {
  flag: DRAFT_FLAG,
  eyebrow: "ABOUT NATURE NESTO",
  title: "A plant and decor studio in Lahore",
  intro:
    "We help people live with plants and make rooms feel considered. From a single pot on a desk to a full office, we plan, supply and style it with you.",
  image: {
    src: "/images/hero-poster.webp",
    alt: "A bright room styled with leafy indoor plants and ceramic pots",
  },
  what: {
    eyebrow: "WHAT WE DO",
    title: "Plants, pots and the thinking around them",
    paragraphs: [
      "Nature Nesto sells plants, pots and planters, and runs a consultative styling service alongside the shop. Space planning, plant styling, custom posters and quotes, gift bundles, pot customization and corporate styling all sit under one roof.",
      "Every recommendation starts with your space: its light, its size and how you actually live in it.",
    ],
    image: {
      src: "/images/categories/indoor-plants.webp",
      alt: "Indoor plants arranged on a shelf in natural light",
    },
    cta: { label: "See our services", href: "/services" },
  },
  valuesTitle: "How we like to work",
  values: [
    {
      title: "Expert guidance",
      body: "Success starts with choosing the right plant. We match each one to your light, space and routine.",
    },
    {
      title: "Connect and grow",
      body: "Workshops and events give you a place to learn, ask questions and meet other plant people.",
    },
    {
      title: "Judgement free",
      body: "No question is too small. Start wherever you are and we will take it from there.",
    },
  ],
  stepsEyebrow: "THE PROCESS",
  stepsTitle: "From first message to finished space",
  cta: {
    title: "Let us style your space",
    body: "Tell us about the room, the light and the mood. We will come back with a plan.",
    primary: consult,
    secondary: contact,
  },
};

export const storyPage = {
  flag: DRAFT_FLAG,
  eyebrow: "OUR STORY",
  title: "One plant. One piece. One vibe at a time.",
  intro:
    "Nature Nesto began with a simple idea: a home feels finished when it has something alive in it.",
  image: {
    src: "/images/banner.webp",
    alt: "Green foliage against a warm neutral wall",
  },
  chapters: [
    {
      eyebrow: "THE IDEA",
      title: "Start small, stay curious",
      paragraphs: [
        "Most people do not need a jungle. They need the right plant in the right corner, and someone to tell them how to look after it.",
        "That is how we think about every order, whether it is one pot or a whole floor.",
      ],
      image: {
        src: "/images/products/monstera.webp",
        alt: "A monstera plant in a ceramic pot",
      },
    },
    {
      eyebrow: "THE STUDIO",
      title: "Plants, pots and a point of view",
      paragraphs: [
        "We work from Lahore and style spaces of every size: homes, offices, cafes and shopfronts. The aim is always the same, to make a place feel calmer and more like its owner.",
      ],
      image: {
        src: "/images/categories/easy-care.webp",
        alt: "Easy care plants styled together in a bright room",
      },
    },
    {
      eyebrow: "THE PROMISE",
      title: "Care that continues after delivery",
      paragraphs: [
        "Choosing a plant is the easy part. We stay available for care advice and offer ongoing maintenance for businesses and busy households, so what we plant keeps thriving.",
      ],
      image: {
        src: "/images/categories/plant-care.webp",
        alt: "Plant care tools and soil set out on a table",
      },
    },
  ],
  quote: site.tagline.home,
  cta: {
    title: "Start with one plant",
    body: "Browse the shop or talk to the studio about a space you have in mind.",
    primary: { label: "Shop plants", href: "/indoor-plants" },
    secondary: contact,
  },
};

export const shippingPage = {
  flag: `${DRAFT_FLAG} Charges, areas and timelines are not confirmed.`,
  eyebrow: "CUSTOMER SERVICES",
  title: "Shipping & Handling",
  intro:
    "Plants are alive, so we pack and deliver them differently from other goods. This is how an order reaches you.",
  updated: "To be dated at launch.",
  sections: [
    {
      id: "areas",
      title: "Where we deliver",
      paragraphs: [
        "We deliver within Lahore from our studio. For other cities, message us before ordering and we will confirm what is possible for your plant.",
      ],
    },
    {
      id: "timelines",
      title: "Delivery timelines",
      paragraphs: [
        "Orders are confirmed by message or call. Delivery times depend on the plant, its size and your area, and we share the expected day when we confirm.",
      ],
    },
    {
      id: "packaging",
      title: "Packaging and handling",
      bullets: [
        "Plants are watered and checked before dispatch.",
        "Pots and planters are wrapped to protect glazed and painted finishes.",
        "Large plants are secured upright for the journey.",
      ],
    },
    {
      id: "charges",
      title: "Delivery charges",
      paragraphs: [
        "Delivery charges depend on your area and the size of your order. The amount is shown at checkout or shared when we confirm your order.",
      ],
    },
    {
      id: "arrival",
      title: "When your order arrives",
      bullets: [
        "Unpack plants soon after delivery and place them in bright, indirect light.",
        "Check your order while the delivery person is present where you can.",
        "Photograph anything damaged and message us the same day.",
      ],
    },
    {
      id: "returns",
      title: "Damage and returns",
      paragraphs: [
        "If a plant or pot arrives damaged, send us photos within 24 hours and we will arrange a replacement or a fix. Because plants are living, we cannot accept returns for changes of mind.",
      ],
    },
    {
      id: "help",
      title: "Questions",
      paragraphs: [`Write to ${site.email} or message us on WhatsApp and we will help.`],
    },
  ] satisfies PolicySection[],
};

export const policyPage = {
  flag: `${DRAFT_FLAG} Needs review by the client before publishing.`,
  eyebrow: "EXPLORE",
  title: "Work Place Policy",
  intro: "How we work with each other, with clients and with the spaces we are invited into.",
  updated: "To be dated at launch.",
  sections: [
    {
      id: "respect",
      title: "Respect and conduct",
      paragraphs: [
        "We treat teammates, clients and suppliers with courtesy and honesty. Discrimination, harassment and bullying have no place in our studio or on client sites.",
      ],
    },
    {
      id: "client-sites",
      title: "Working in client spaces",
      bullets: [
        "Arrive on time and in tidy clothing.",
        "Protect floors, furniture and fixtures while installing.",
        "Leave the space clean, with soil and packaging removed.",
        "Treat everything seen on site as confidential.",
      ],
    },
    {
      id: "safety",
      title: "Health and safety",
      paragraphs: [
        "Lifting large pots and plants takes technique and teamwork. We ask for help instead of risking injury, and we report any incident to the studio lead the same day.",
      ],
    },
    {
      id: "materials",
      title: "Plant care products",
      paragraphs: [
        "Fertilizers and sprays are stored closed and labelled, used as directed and kept away from food, children and pets.",
      ],
    },
    {
      id: "reporting",
      title: "Raising a concern",
      paragraphs: [
        `Anyone can raise a concern in confidence by writing to ${site.email}. Concerns are taken seriously and handled fairly.`,
      ],
    },
  ] satisfies PolicySection[],
};

export const careersPage = {
  flag: `${DRAFT_FLAG} No open roles were supplied.`,
  eyebrow: "CAREERS",
  title: "Work with us",
  intro:
    "We are a small studio that cares about plants, design and doing things properly. If that sounds like you, we would like to hear from you.",
  image: {
    src: "/images/categories/large-plants.webp",
    alt: "Tall leafy plants in a bright studio space",
  },
  whyTitle: "What it is like here",
  why: [
    {
      title: "Hands on",
      body: "You will work with real plants and real spaces, from sourcing to installation.",
    },
    {
      title: "Always learning",
      body: "Plant care and styling are craft skills, and we make time to teach them.",
    },
    {
      title: "Kind by default",
      body: "Judgement free is not just for customers. It is how the team works too.",
    },
  ],
  rolesTitle: "Open roles",
  rolesEmpty:
    "There are no open roles listed right now. We still like meeting people, so send us a short note and your CV.",
  apply: { label: "Email your CV", href: `mailto:${site.email}?subject=Careers` },
};

export interface ServiceCopy {
  intro: string;
  includes: string[];
  forWho: string;
}

/** Service descriptions drafted for the rebuild. Keyed by service slug. */
export const serviceCopy: Record<string, ServiceCopy> = {
  "space-planning": {
    intro:
      "We look at your room, its light and how you use it, then plan where plants and decor should go so the space feels balanced.",
    includes: [
      "Review of your space, photos and dimensions",
      "Plant and decor recommendations matched to light",
      "A simple layout and placement plan",
      "Shopping list you can order from us",
    ],
    forWho: "Homes, offices and cafes that want a clear plan before buying anything.",
  },
  "plant-styling": {
    intro:
      "Our stylists choose, pair and place indoor and outdoor plants so they look good and stay healthy where they live.",
    includes: [
      "Plant selection for your light and climate",
      "Pot and planter pairing",
      "Delivery and on site placement",
      "Care guidance for every plant",
    ],
    forWho: "Anyone who wants plants that look intentional from day one.",
  },
  "custom-posters": {
    intro:
      "Quotes, names and artwork designed for your space and printed to finish a wall the way you imagine it.",
    includes: [
      "Custom layout and typography",
      "Choice of size and finish",
      "Proof for your approval before printing",
      "Delivery or installation with styling",
    ],
    forWho: "Homes and businesses that want a personal touch on the wall.",
  },
  "gift-bundles": {
    intro:
      "Plants, pots and small extras put together as a considered gift, with a note in your words.",
    includes: [
      "Plant and pot chosen for the person",
      "Gift wrapping and personal note",
      "Care card included",
      "Delivery to the recipient on request",
    ],
    forWho: "Birthdays, weddings, thank yous and corporate gifting.",
  },
  "pot-customization": {
    intro:
      "Make a pot or piece of decor your own with custom colours, text or finishes, made to suit the plant and the room.",
    includes: [
      "Choice of pot style and size",
      "Custom colour, text or artwork",
      "Sample or mockup before production",
      "Planting and delivery if you like",
    ],
    forWho: "Gifts, events, shops and anyone who wants something one of a kind.",
  },
  "corporate-styling": {
    intro:
      "Plants and decor for offices, hotels and commercial spaces, planned to suit your brand and looked after through the year.",
    includes: [
      "Site visit and design concept",
      "Supply, delivery and installation",
      "Ongoing plant care and replacements",
      "A single point of contact for the account",
    ],
    forWho: "Offices, restaurants, clinics, retail and hospitality.",
  },
};

export const serviceDetail = {
  flag: DRAFT_FLAG,
  includesTitle: "What is included",
  forWhoTitle: "Who it is for",
  allServices: "More services",
};
