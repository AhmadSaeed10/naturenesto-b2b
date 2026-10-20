# NatureNesto

Next.js rebuild of naturenesto.com for a Lahore based plant and decor studio. Brand, content and information architecture are preserved; craft is elevated with editorial typography, texture and motion.

Read `CLAUDE.md` before contributing. It is the working agreement for brand tokens, typography, motion, accessibility and conventions.

## Stack

Next.js 16 (App Router), React 19, TypeScript strict, Tailwind CSS v4, ESLint, Prettier. Requires Node 22.18 or newer (scripts run TypeScript natively).

## Scripts

| Script              | What it does                                                                        |
| ------------------- | ----------------------------------------------------------------------------------- |
| `npm run dev`       | Start the dev server (regenerates tokens first)                                     |
| `npm run build`     | Production build (regenerates tokens first). Must pass before any PR                |
| `npm run start`     | Serve the production build                                                          |
| `npm run lint`      | ESLint. Must pass                                                                   |
| `npm run typecheck` | Generate route types, then `tsc --noEmit`. Must pass                                |
| `npm run format`    | Prettier write. `format:check` to verify only                                       |
| `npm run tokens`    | Regenerate `src/styles/tokens.css` from `src/lib/tokens.ts`                         |
| `npm run contrast`  | WCAG contrast report for token pairs. Fails if an approved text pair drops below AA |

## Design tokens

`src/lib/tokens.ts` is the single source of truth. Tailwind v4 reads its theme from CSS, so `npm run tokens` compiles the tokens into a `@theme` block in `src/styles/tokens.css` (generated, do not edit). The default Tailwind palette is cleared, so only brand colours exist as utilities: `bg-background`, `bg-surface`, `text-ink`, `text-ink-muted`, `text-primary-dark`, `bg-primary`, `border-line` and so on.

Colour rules:

- Use `primary-dark` for green text and links. `primary` is for fills, icons, large text and decoration only.
- CTA fills use `primary-dark` with a `background` label. A label on `primary` or `accent` fails AA for normal text.
- Do not set `ink-muted` body text on `surface`. Use `ink` there.
- Never hardcode hex values outside `tokens.ts`.

Colour values are estimates from the logo and are marked UNCONFIRMED until checked against the original SVG.

Type utilities: `text-display`, `text-h1` to `text-h4`, `text-lead`, `text-body`, `text-small`, plus the `eyebrow` utility. Fonts: `font-serif` (Instrument Serif, italic for emphasis) and `font-sans` (DM Sans).

Texture: the page carries a fixed paper grain behind all content. Add `grain` to a surface for local grain.

## Motion guide

All motion values live in `src/lib/tokens.ts` (`TOKENS.motion`) and are exposed to components through `src/lib/motion.ts`. CSS transitions use the same curve via `ease-brand` and the `duration-(--duration-micro)` style utilities. Rules: animate only transform, opacity and clip-path; never layout properties.

| Primitive                 | Use                        | Behaviour                                                                                                                            | Reduced motion           | Touch                 |
| ------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------ | --------------------- |
| `Reveal`                  | Any block entering view    | Fade + rise 24px, once, at 15% in view                                                                                               | Opacity fade             | Same as desktop       |
| `SplitHeading`            | Section and hero headlines | Words grouped into the lines the browser wraps, each line slides up from a mask with an 80ms stagger. `emphasis` words render italic | Plain text, opacity fade | Same as desktop       |
| `Stagger` + `StaggerItem` | Card and tile groups       | Children fade up in sequence (`each`, default 80ms)                                                                                  | Opacity fade             | Same as desktop       |
| `ParallaxImage`           | Feature images             | Clip-path inset reveal with scale 1.08 to 1, then scroll drift of up to 40px                                                         | Opacity fade, no drift   | Reveal only, no drift |
| `Magnetic`                | Primary CTAs               | Pulls its child toward the pointer, max 8px                                                                                          | Off                      | Off                   |
| `CursorFollower`          | Mounted once in the layout | Shows a "View" disc over any element with `data-cursor="view"`                                                                       | Off                      | Off                   |

Examples:

```tsx
<SplitHeading as="h2" text={banner.headline} emphasis={["future"]} className="text-h1" />

<Stagger as="ul" className="grid grid-cols-2 gap-4">
  {items.map((item) => (
    <StaggerItem as="li" key={item.slug}>...</StaggerItem>
  ))}
</Stagger>

<ParallaxImage src={src} alt={alt} sizes="50vw" className="aspect-[4/5] rounded-card" />

<Magnetic>
  <Button href={cta.href} withArrow>{cta.label}</Button>
</Magnetic>

<Link href={category.href} data-cursor="view">...</Link>
```

Notes:

- `MotionProvider` (root layout) sets `reducedMotion="user"`, so Motion keeps opacity but skips transforms when the OS asks for less motion. Each primitive also selects an explicit reduced variant.
- Pointer effects only run on `(hover: hover) and (pointer: fine)` via `useRichMotion()` in `src/lib/hooks.ts`.
- Special moments (torn paper, stamp edge, lace frame) appear once each. Do not reuse them as generic effects.
- Smooth scrolling uses native CSS `scroll-behavior`, disabled under reduced motion. Lenis is not used.
- `/dev/motion` demos every primitive (noindex). It is removed in Phase 8.

## Content editing

Content, products and settings live in `content/` and are edited in Keystatic at `/keystatic` (a Git CMS: every save is a commit and Vercel redeploys). The typed files in `src/content` hold the shipped copy and act as the fallback for every field.

- Source of truth for homepage copy: `docs/homepage-copy.md`. Copy is verbatim and is never rewritten.
- Any `flag` field marks an open item for client confirmation. List them with `grep -rn "flag:" src/content`.
- Old live URLs are redirected (308) to clean slugs via `src/content/redirects.ts`; more can be added in Keystatic.
- Setup, editing guide, orders and bulk quotes: `docs/CMS.md`.

## Shop

Products are Keystatic entries (`content/products`). The cart lives in the browser; checkout re-prices on the server and sends the order by email (Resend) with a WhatsApp handoff. Every product page has "Request bulk pricing" for business orders. See `docs/CMS.md`.

## Project structure

```
src/
  app/          routes, layouts, metadata
  components/   layout, sections, ui, motion
  content/      typed copy and link data
  lib/          tokens, fonts, catalogue, cart, order pricing, email, CMS reads
  styles/       generated token CSS
content/        Keystatic content (YAML), edited at /keystatic
keystatic.config.ts  CMS schema
scripts/        token build and contrast check
docs/           copy source, CMS guide and phase prompts
```
