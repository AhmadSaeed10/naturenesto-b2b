import type { SocialLink } from "./types";

const PHONE_WHATSAPP = "+923180427602";
const PHONE_CALL = "+923224024862";

export const site = {
  name: "Nature Nesto",
  url: "https://naturenesto.com",
  email: "info@naturenesto.com",
  address:
    "83/S Commercial Block, 1st Floor Rabeel, Imperial Garden, Paragon City Barki Road Lahore",
  phones: {
    whatsapp: { display: "+92 318 0427 602", e164: PHONE_WHATSAPP },
    call: { display: "+92 322 4024 862", e164: PHONE_CALL },
    flag: "Pasted copy does not say which number is WhatsApp and which is Call. Mapping is a guess.",
  },
  announcement: "Transform your space with exclusive discounts!",
  tagline: {
    home: "One Plant. One Piece. One Vibe at a time.",
    logo: "Nature . Design . Interiors",
    flag: "Descriptor in the supplied logo files; replaces the earlier Leaves . Delight . Nesto line.",
  },
  legal: "2026 Nature Nesto, All Rights Reserved.",
  socials: [
    {
      platform: "facebook",
      label: "Facebook",
      href: "#",
      flag: "Placeholder URL. Client to supply.",
    },
    {
      platform: "instagram",
      label: "Instagram",
      href: "#",
      flag: "Placeholder URL. Client to supply.",
    },
    {
      platform: "linkedin",
      label: "LinkedIn",
      href: "#",
      flag: "Placeholder URL. Client to supply.",
    },
    {
      platform: "twitter",
      label: "Twitter",
      href: "#",
      flag: "Placeholder URL. Client to supply.",
    },
  ] satisfies SocialLink[],
} as const;
