# NatureNesto: Next.js Rebuild

Rebuild of https://naturenesto.com as a Next.js + TypeScript project. This is a mentor's project. Preserve brand, content and information architecture. Elevate craft with editorial typography, texture, micro interactions and reveal animations.

## Working agreement (read first)
- Consult before implementing. At the start of every phase: enter plan mode, present the plan, list open questions, and wait for approval.
- Never change copy, IA, brand tokens or dependencies without asking.
- One phase per branch. Small, reviewable commits using conventional commit messages (feat, fix, chore, refactor, style).
- Never push to main. Open a PR per phase; Vercel preview deploys are the review surface.
- After each phase: summarize what was built, what was decided, what is open. Keep it short.
- If something is ambiguous, ask. Do not guess brand or content decisions.

## About the business
Lahore based plant and decor studio. Sells plants, pots and planters. Runs a consultative styling service: space planning, plant styling, custom posters and quotes, gift bundles, pot customization, corporate styling, ongoing plant care.
Tone: warm, reassuring, judgement free, premium but approachable.
Homepage tagline: "One Plant. One Piece. One Vibe at a time."
Logo tagline: "Leaves . Delight . Nesto" (confirm with mentor which leads the brand).
Address: 83/S Commercial Block, 1st Floor Rabeel, Imperial Garden, Paragon City, Barki Road, Lahore.
Email: info@naturenesto.com

## Content source of truth
The live site is not reachable from the build environment. All homepage copy, link labels and URLs come from docs/homepage-copy.md. Never fetch naturenesto.com. Never rewrite client copy. Anything marked (inferred) or flagged in that file is an open item for client confirmation.

## Stack
- Next.js 16 (App Router), React 19, TypeScript strict (no `any`, no non-null assertions without a comment)
- Tailwind CSS v4, theme generated from `src/lib/tokens.ts`
- Motion (`motion/react`) for animation. Lenis dropped in Phase 3: native scroll keeps keyboard and assistive tech behaviour intact
- next/font, next/image, next/link everywhere
- ESLint, Prettier, absolute imports via `@/`
- Deploy: GitHub + Vercel

## Backend (Supabase)
Project ref: uqxzuzejnyacrshssdpz (NatureNesto-Mumbai, ap-south-1). Secrets only in .env.local, Vercel env and GitHub Actions secrets, never in code, logs or commits. Service role key is server only. All schema changes are migrations in supabase/migrations. The database is the source of truth for products, orders, customers, media and CMS content. Admin lives at /admin (noindex, role gated). Follow docs/ADMIN.md.

## Backend (Neon, in progress)
The backend is moving from Supabase to Neon Postgres on free tiers (see docs/NEON.md). New schema changes are migrations in `db/migrations`, applied with `npm run db:migrate`. There is no row level security: check the user's role in server code before any write, and run writes through `withActor` in `src/lib/db` so the audit log records who did it. Until the data layer phase lands, the app still reads from Supabase and the Supabase section above applies.

## Commands
- `npm run dev` start dev server
- `npm run build` production build (must pass before any PR)
- `npm run lint` ESLint (must pass)
- `npm run typecheck` tsc with noEmit (add this script in phase 1; must pass)

## Structure
```
src/
  app/                 routes, layouts, metadata
  components/
    layout/            Header, Footer, AnnouncementBar
    sections/          one file per homepage section
    ui/                Button, Card, Tile, Eyebrow, Icon
    motion/            Reveal, SplitHeading, Stagger, ParallaxImage, Magnetic
  content/             typed data: site.ts, nav.ts, services.ts, categories.ts, steps.ts
  lib/                 tokens.ts, motion.ts, fonts.ts, seo.ts, utils.ts
public/                static assets, optimized images
```
All copy and link data lives in `src/content`. Components receive typed props. No hardcoded copy in JSX.

## Brand tokens (single source of truth: `src/lib/tokens.ts`)
Values below are estimates read from the logo. Confirm with an eyedropper on the original SVG, then update this file and tokens.ts together.

```ts
export const TOKENS = {
  color: {
    primary: "#2E9B3A",      // leaf green, from logo
    primaryDark: "#1F6F2B",  // text safe green, derived
    accent: "#2E9B3A",       // CTAs, confirm if a separate accent exists
    background: "#FBF9F6",   // derived warm off white
    surface: "#F1EDE7",      // derived
    ink: "#5A4A4A",          // wordmark brown
    inkMuted: "#7D6E6E",     // tagline taupe
    line: "#D9D2CA",         // derived
  },
  radius: { card: "20px", pill: "999px" },
} as const;
```
Rules:
- Use only these colors. Tints and shades via color-mix or opacity of these tokens. No new hues.
- Leaf green on light backgrounds is about 3.5:1 and fails AA for small text. Use `primaryDark` for green text and links. Use `primary` for fills, icons, large text and decoration.
- Never hardcode hex values outside tokens.ts.

## Typography
- Headings: Instrument Serif (regular and italic) via next/font/google. Italic for emphasis words inside headlines. Large scale, leading 0.95 to 1.05, slight negative tracking.
- Body and UI: keep the existing site's body font if identified, else DM Sans or Inter. Defined once in `src/lib/fonts.ts`.
- Fluid scale with clamp(). Eyebrow labels: small uppercase, wide tracking, to echo the logo wordmark.

## Visual direction
- Editorial, print inspired, slightly vintage botanical. Riso and halftone texture, subtle film grain (SVG noise, 3 to 5 percent opacity).
- Dithered or stippled duotone decoration using CSS mask or SVG filter. Render in primaryDark and ink at low opacity. Reserve the bright primary for CTAs and key accents.
- Rounded cards (20px), generous whitespace, tall portrait cards in an offset masonry grid, poster style crops.
- Logo motifs: brown square frame as a recurring device (image frames, corner brackets, hover outlines). Bamboo stalk shapes as inline SVG accents that sway subtly.
- Special moments (one each, not everywhere): lace or botanical frame around a featured image, perforated stamp edge image mask, torn paper reveal for a hero or CTA.
- Texture supports the brand and never reduces legibility.

## Motion system (centralized in `src/lib/motion.ts`)
- Easing: cubic-bezier(0.22, 1, 0.36, 1). Micro 150 to 250ms. Reveals 600 to 900ms.
- Section reveal: fade + translateY 24px, in view once, 15 percent threshold.
- Headlines: line by line mask reveal, 80ms stagger.
- Cards and tiles: staggered fade up, 60 to 100ms.
- Images: clip-path inset reveal with scale 1.08 to 1.
- How It Works: active step tied to scroll progress, illustration parallax max 40px.
- Reusable primitives: Reveal, SplitHeading, Stagger, ParallaxImage, Magnetic.
- Only animate transform and opacity (plus clip-path). No layout thrash.

## Micro interactions
- Buttons: arrow nudges 4px, fill wipe on hover, pressed scale 0.98.
- Nav links: underline draws from left, active indicator.
- Category tiles: image zoom 1.05, label shift, circular "View" cursor follower on desktop only.
- Service cards: lift 4px with soft shadow, icon or leaf sways.
- Magnetic CTAs: max 8px pull, desktop only.
- Header: hides on scroll down, shows on scroll up, shrinks and blurs.
- Forms: floating labels, animated focus ring, inline validation.
- Announcement bar: dismiss with height collapse.
- Floating WhatsApp button: idle pulse for 3 cycles, then still.
- Route transitions: soft fade.
- Every interaction needs a visible focus-visible state and keyboard parity.

## Accessibility and performance (non negotiable)
- WCAG 2.2 AA contrast. Report any failing pair.
- `prefers-reduced-motion`: disable parallax, magnetic and long reveals. Keep simple opacity fades.
- One h1 per page, semantic landmarks, real alt text on every image, aria labels on icon buttons, touch targets 44px minimum.
- Test at 375, 768, 1280, 1536.
- Lighthouse: Performance 90+, Accessibility 100, SEO 100.
- Lazy load below the fold, AVIF/WebP, explicit dimensions to prevent CLS. Hero video has a poster, metadata preload, and does not autoplay on data saver.
- SEO: per page metadata, clean slugs, Open Graph with alt text, LocalBusiness JSON-LD.

## Homepage sections (preserve order and copy)
1. Announcement bar: "Transform your space with exclusive discounts!" (dismissible)
2. Header: logo, nav (Pots & Planters, Indoor Plants, Outdoor Plants, Contact), plus new Services link and "Book a Consultation" button
3. Hero: video background (Pexels source kept), "Bring Life to Your Space", "Welcome to Nature Nesto", Shop Now
4. Tagline strip: One Plant / One Piece / One Vibe at a time, with icons
5. Value props: Expert Guidance, Connect & Grow, Judgement-Free Service
6. How It Works: 5 numbered steps with drawing illustration, sticky left column
7. Services grid: 6 cards
8. Banner: "Predict the future by creating it" + Shop Now
9. Plants For Everyone: Indoor, Outdoor, Pet Friendly, Easy Care, Orchids, Large Plants, Low Light, Plants Care
10. Need Help?: Chat/WhatsApp, Call, Email
11. Footer: Services, Customer Services (FAQ, Shipping & Handling, Contact), Explore (Our Story, Career, Workshops, Blogs, About Us, Work Place Policy), address, socials, copyright

Routes to stub with the shared layout so nothing 404s: /pots-and-planters, /indoor-plants, /outdoor-plants, /contact, /services/*, /faq, /about, /workplace-policy, /shipping, /blogs, /workshops, /careers, /our-story.

## Known issues on the current site (fix in rebuild)
- Social links point to generic root URLs: use placeholders in `content/site.ts`, flag for client.
- Footer FAQ link is split into two anchors: one link.
- Several category tiles are unlinked: link all.
- Alt text is auto generated and wrong in places: write proper alts.
- "Judgement-Free" spelling: keep, flag for review.
- Services missing from main nav: add.
- Title and meta description are keyword stuffed, slugs inconsistent: clean up.

## Code conventions
- Server components by default. Add "use client" only for interactivity or animation, and keep client islands small.
- Named exports for components. Props typed with explicit interfaces.
- No inline hex colors, magic numbers for motion, or copy in JSX.
- Images through next/image with sizes set. SVG icons as components.
- Comments explain why, not what.

## Do not
- Do not install packages without asking.
- Do not add CSS-in-JS libraries or UI kits.
- Do not use em dashes in copy or comments.
- Do not alter the brand palette, logo or copy.
- Do not skip lint, typecheck or build before declaring a phase done.

## Definition of done (every phase)
Lint, typecheck and build pass. Responsive at all four breakpoints. Keyboard navigable. Reduced motion respected. Phase summary posted. PR opened against main with a preview link.
