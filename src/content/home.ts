import { photoUrl } from "./photos";
import { site } from "./site";
import type { ContactChannel, Cta, IconItem, ValueProp } from "./types";

const shopNow: Cta = {
  label: "Shop Now",
  href: "/pots-and-planters",
  flag: "Shop destination to confirm. No online shop in scope yet.",
};

export const hero = {
  headline: "Bring Life to Your Space",
  subline: "Welcome to Nature Nesto",
  secondary: "Transform Your Space with Us",
  cta: shopNow,
  poster: {
    src: photoUrl("room-plants-b", 1600),
    flag: "Stand-in photograph. Replace with a frame from the final hero video.",
  },
  video: {
    src: "https://videos.pexels.com/video-files/3770017/3770017-hd_1920_1080_25fps.mp4",
    flag: "Inferred from an earlier fetch. Confirm usage rights and poster frame.",
  },
};

export const taglineStrip: IconItem[] = [
  { text: "One Plant", icon: "plant" },
  { text: "One Piece", icon: "vase" },
  { text: "One Vibe at a time.", icon: "table" },
];

export const valueProps: ValueProp[] = [
  {
    title: "Expert Guidance",
    body: "Success starts with choosing the right plants. We'll make sure you do.",
    icon: "guidance",
  },
  {
    title: "Connect & Grow",
    body: "Community is everything. Our workshops and events help you learn and connect.",
    icon: "community",
  },
  {
    title: "Judgement-Free Service",
    body: "Our dedicated team is always available to assist — no question too small or too silly!",
    icon: "support",
  },
];

export const banner = {
  headline: "Predict the future by creating it",
  secondary: "Transform Your Space with Us",
  cta: shopNow,
  image: {
    src: photoUrl("room-plants-a", 1600),
    alt: "",
    flag: "Stand-in photograph. Replace with the studio's own.",
  },
};

export const needHelp = {
  title: "Need Help?",
  body: "Your confidence is our priority. Unsure what plants will work with your light? New to gardening outdoors and need some advice? Reach out, we're here to help.",
  signOff: "SPEAK TO TEAM NATURE NESTO",
  channels: [
    {
      kind: "whatsapp",
      label: "Chat/ WhatsApp",
      prompt: "DM to expert",
      display: site.phones.whatsapp.display,
      href: `https://wa.me/${site.phones.whatsapp.e164.slice(1)}`,
      flag: site.phones.flag,
    },
    {
      kind: "call",
      label: "Call",
      prompt: "Speak to expert",
      display: site.phones.call.display,
      href: `tel:${site.phones.call.e164}`,
      flag: site.phones.flag,
    },
    {
      kind: "email",
      label: "Email",
      prompt: "Send a note to",
      display: site.email,
      href: `mailto:${site.email}`,
    },
  ] satisfies ContactChannel[],
};
