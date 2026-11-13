import { DRAFT_FLAG } from "./pages-copy";
import { photoImage } from "./photos";
import { site } from "./site";

// Extra sections for the footer pages. Every figure, name, quote, hour and timeline below is
// drafted for the rebuild, not supplied by the client. (inferred) Client to confirm or replace
// before launch; the full list is in docs/CONTENT.md. Team photos are plant stand-ins.

export const EXTRA_FLAG = `${DRAFT_FLAG} Figures, people, quotes and times are placeholders.`;

export const stats = [
  { value: "5+", label: "Years in Lahore" },
  { value: "2,000+", label: "Plants placed" },
  { value: "150+", label: "Spaces styled" },
  { value: "4.9", label: "Average review" },
];

export const mosaic = [
  photoImage("room-plants-b", "A living room corner with large leafy plants"),
  photoImage("terracotta-stack", "Stacked terracotta pots in warm light"),
  photoImage("fiddle-a", "A tall fiddle leaf fig by a window"),
  photoImage("desk-succulents", "Small succulents lined up on a desk"),
  photoImage("table-plants", "Plants grouped on a wooden table"),
];

export const founder = {
  eyebrow: "A NOTE FROM THE STUDIO",
  quote:
    "A plant should make a room easier to live in, not harder. We would rather tell you which plant to skip than sell you one that struggles.",
  name: "The founder",
  role: "Founder and lead stylist, Nature Nesto",
  image: photoImage("monstera-pot", "A monstera in a ceramic pot beside a bright window"),
};

export const team = {
  eyebrow: "THE TEAM",
  title: "The people behind the plants",
  intro: "A small studio, so you usually speak to the person who will style your space.",
  people: [
    {
      name: "Lead stylist",
      role: "Space planning",
      body: "Reads a room's light and layout, then builds the plant and pot plan.",
      image: photoImage("areca-a", "A tall areca palm in a bright room"),
    },
    {
      name: "Plant care lead",
      role: "Care and advice",
      body: "Answers the what is wrong with my plant messages, kindly and quickly.",
      image: photoImage("pothos-a", "Trailing pothos leaves"),
    },
    {
      name: "Pots and decor",
      role: "Planters and posters",
      body: "Curates the pots, planters and custom pieces that finish a corner.",
      image: photoImage("pot-bw", "A ceramic pot beside green leaves"),
    },
    {
      name: "Delivery and setup",
      role: "Logistics",
      body: "Gets every plant to your door and into place without a broken leaf.",
      image: photoImage("snake-a", "A snake plant in a white pot"),
    },
  ],
};

export const testimonials = {
  eyebrow: "KIND WORDS",
  title: "What customers say",
  items: [
    {
      quote:
        "They asked about my light before they sold me anything. Six months later every plant is still alive.",
      name: "Ayesha K.",
      place: "Gulberg, Lahore",
    },
    {
      quote: "The office looks completely different. Our team stops to look at the wall of plants.",
      name: "Hamza R.",
      place: "Office styling, DHA",
    },
    {
      quote: "Delivery was careful and the care card made it easy for a beginner like me.",
      name: "Sana M.",
      place: "Johar Town, Lahore",
    },
  ],
};

export const timeline = {
  eyebrow: "THE JOURNEY",
  title: "How the studio grew",
  items: [
    {
      year: "2019",
      title: "A few pots and a big idea",
      body: "Nature Nesto starts with a small selection of easy plants and a promise to give honest advice.",
    },
    {
      year: "2021",
      title: "Styling becomes a service",
      body: "Customers keep asking for help arranging their rooms, so space planning and plant styling join the shop.",
    },
    {
      year: "2023",
      title: "Offices, cafes and gifting",
      body: "Corporate styling, gift bundles and custom pots widen what the studio can do.",
    },
    {
      year: "2025",
      title: "Workshops and ongoing care",
      body: "Hands-on workshops and care plans keep customers growing long after delivery.",
    },
  ],
};

export const careers = {
  perksTitle: "Why people stay",
  perks: [
    {
      title: "Learning budget",
      body: "Time and budget for courses in horticulture, styling and design.",
    },
    {
      title: "Flexible hours",
      body: "Studio days are fixed, the rest is planned around the team.",
    },
    { title: "Plant allowance", body: "A monthly plant for your own home or desk." },
  ],
  hiringEyebrow: "HOW HIRING WORKS",
  hiringTitle: "Four simple steps",
  hiringSteps: [
    { title: "Send a note", body: "A short message and your CV or portfolio is enough." },
    { title: "Casual chat", body: "A 20 minute call about you and what you want to do." },
    { title: "Studio day", body: "Spend a paid day with the team and work on a real brief." },
    { title: "Offer", body: "We reply within a week, with feedback either way." },
  ],
};

export const workshops = {
  eyebrow: "WHAT TO EXPECT",
  title: "A relaxed, hands-on session",
  steps: [
    {
      title: "Arrive and settle",
      body: "Tea, an introduction and a quick look at what we will make.",
    },
    {
      title: "Learn the basics",
      body: "A short demo on light, water and soil, with time for questions.",
    },
    { title: "Make something", body: "Pot it, plant it and style it with materials we provide." },
    { title: "Take it home", body: "Leave with your creation and a simple care card." },
  ],
};

export const blogTopics = {
  eyebrow: "BROWSE BY TOPIC",
  topics: [
    { label: "Plant care", href: "/blogs" },
    { label: "Styling ideas", href: "/blogs" },
    { label: "Pots and planters", href: "/blogs" },
    { label: "Seasonal tips", href: "/blogs" },
  ],
  cta: {
    title: "Have a plant question?",
    body: "Send it to the studio and it might become our next post.",
    primary: { label: "Ask the studio", href: "/contact" },
    secondary: { label: "Browse the shop", href: "/indoor-plants" },
  },
};

export const servicesIndex = {
  testimonials: {
    eyebrow: "CLIENT WORK",
    title: "Styled with care",
  },
};

export const shippingExtra = {
  facts: [
    {
      label: "DELIVERY",
      title: "Careful, tracked delivery",
      body: "We confirm every order by phone and arrange delivery for your city.",
    },
    {
      label: "PAYMENT",
      title: "Cash on delivery",
      body: "Available for most orders. We call to confirm before dispatch.",
    },
    {
      label: "ARRIVAL",
      title: "Packed for plants",
      body: "Plants travel upright and wrapped so leaves and pots arrive intact.",
    },
  ],
  stepsEyebrow: "HOW IT WORKS",
  stepsTitle: "From order to doorstep",
  steps: [
    { title: "Place your order", body: "Checkout online or message us on WhatsApp." },
    { title: "We call to confirm", body: "Address, timing and any care questions." },
    { title: "Packed and dispatched", body: "Your plants are checked, wrapped and sent." },
    { title: "Delivered", body: "Unpack, place and message us if anything looks off." },
  ],
  help: "Questions about a delivery? Message us and we will find out.",
};

export const policyExtra = {
  facts: [
    {
      label: "RESPECT",
      title: "Judgement free",
      body: "Everyone is treated kindly, customers and colleagues alike.",
    },
    {
      label: "SAFETY",
      title: "Safe sites",
      body: "Installations follow simple safety checks for people, plants and property.",
    },
    {
      label: "HONESTY",
      title: "Clear and fair",
      body: "We say what we can and cannot do, and put it in writing.",
    },
  ],
  help: "Concerns about how we work? Tell us directly.",
};

export const faqExtra = {
  help: "Cannot find your answer? Ask the studio.",
  cta: {
    title: "Still have a question?",
    body: "We answer WhatsApp messages the same day, usually within a few hours.",
    primary: {
      label: "Message on WhatsApp",
      href: `https://wa.me/${site.phones.whatsapp.e164.slice(1)}`,
    },
    secondary: { label: "Contact the studio", href: "/contact" },
  },
};

export const contactExtra = {
  hoursLabel: "Studio hours",
  hours: "Monday to Saturday, 10 am to 7 pm",
  note: "Visits by appointment so a stylist is free to meet you.",
};
