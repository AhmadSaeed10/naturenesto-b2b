import type { ReactNode, SVGProps } from "react";

export type UiIconName =
  | "arrow-right"
  | "arrow-down"
  | "chevron-down"
  | "menu"
  | "close"
  | "play"
  | "pause"
  | "whatsapp"
  | "phone"
  | "mail"
  | "facebook"
  | "instagram"
  | "linkedin"
  | "twitter"
  | "bag";

const PATHS: Record<UiIconName, ReactNode> = {
  "arrow-right": <path d="M4 12h15M13 6l6 6-6 6" />,
  "arrow-down": <path d="M12 4v15M6 13l6 6 6-6" />,
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  menu: <path d="M4 9h16M4 15h16" />,
  play: <path d="M8 5.5v13l10-6.5-10-6.5Z" />,
  pause: <path d="M8.5 5v14M15.5 5v14" />,
  whatsapp: (
    <>
      <path d="M4 20l1.3-4.2A8.5 8.5 0 1 1 8.4 19L4 20Z" />
      <path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.6-2-1-1 .9c-1.2-.5-2.1-1.4-2.6-2.6l.9-1-1-2-1.8 1Z" />
    </>
  ),
  phone: (
    <path d="M6.5 4h3l1.5 4-2 1.3a10 10 0 0 0 5.7 5.7L16 13l4 1.5v3A2 2 0 0 1 18 19.5 15.5 15.5 0 0 1 4.5 6 2 2 0 0 1 6.5 4Z" />
  ),
  mail: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6 6 18" />,
  bag: (
    <>
      <path d="M5 8h14l-1.2 11.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8L5 8Z" />
      <path d="M9 10V7a3 3 0 0 1 6 0v3" />
    </>
  ),
  facebook: (
    <path d="M14.5 8H17V4.5h-2.5A4.5 4.5 0 0 0 10 9v2H7.5v3.5H10V20h3.5v-5.5H16l.5-3.5h-3V9a1 1 0 0 1 1-1Z" />
  ),
  instagram: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17.25 6.75h.01" />
    </>
  ),
  linkedin: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
      <path d="M8 10.5V16M8 7.75v.01M11.75 16v-5.5M11.75 13a2.5 2.5 0 0 1 5 0v3" />
    </>
  ),
  twitter: <path d="M4.5 4.5h3.75l11.25 15h-3.75L4.5 4.5ZM19.5 4.5l-6.25 7M4.5 19.5l6.25-7" />,
};

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: UiIconName;
  size?: number;
}

/** Decorative by default. Give the parent control an aria-label when the icon stands alone. */
export function Icon({ name, size = 20, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
