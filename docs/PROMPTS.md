# NatureNesto: Claude Code Prompt Sequence

Use in order. Start each phase in plan mode (Shift+Tab twice, or /plan). Approve the plan before Claude edits files. Clear context between phases with /clear, since CLAUDE.md reloads automatically.

Setup before Phase 0:
1. Create an empty folder and run `git init`.
2. Drop `CLAUDE.md` in the root, `qa.md` into `.claude/commands/`, `design-reviewer.md` into `.claude/agents/`.
3. Attach the logo and 3 to 4 moodboard images when starting Phase 0 (dithered mountain illustration, lace frame, torn paper road, Arabic poster typography).

---

## Phase 0: Discovery and plan (plan mode, no code)

```
Read CLAUDE.md fully. We are rebuilding https://naturenesto.com in Next.js with TypeScript.

Do not write code yet. Do this:
1. Fetch the live site and every linked page. Report what exists on each route (content, components, forms, media).
2. Study the attached logo and moodboard images and describe the visual language you will apply, in 8 bullets maximum.
3. Propose the final route map and component inventory.
4. Propose the 8 phase plan below, adjusted if you see a better order.
5. List every question you need answered before Phase 1 (brand colors to verify, body font, hero media rights, WhatsApp number format, social URLs, contact form destination).

Stop and wait for my answers.
```

## Phase 1: Foundation

```
Phase 1: foundation. Enter plan mode first and show me the plan.

Scope:
- Scaffold Next.js (App Router, TypeScript, Tailwind, ESLint, src directory, import alias @/).
- Strict TypeScript. Add typecheck script. Configure Prettier.
- Create src/lib/tokens.ts from CLAUDE.md and map it to the Tailwind theme.
- Set up fonts in src/lib/fonts.ts: Baskervville (regular and italic), used for all text (changed from Instrument Serif and DM Sans in phase 23).
- Global styles: base typography scale with clamp(), focus-visible styles, selection color, SVG noise grain utility, reduced motion defaults.
- Create folder structure from CLAUDE.md and the content data files as typed stubs.
- Set up .gitignore, .env.example, README with scripts.

Out of scope: any section UI. Verify lint, typecheck and build pass. Commit on branch phase-1-foundation.
```

## Phase 2: Layout shell

```
Phase 2: layout shell. Plan mode first.

Build AnnouncementBar (dismissible, height collapse), Header (sticky, hides on scroll down, shows on scroll up, blur backdrop, shrink, mobile menu with focus trap and escape to close, Services link, Book a Consultation button) and Footer (all columns from CLAUDE.md, single FAQ link, placeholder socials).
Build ui primitives: Button (variants, arrow nudge, fill wipe), Eyebrow, Card, Icon, Logo (inline SVG, accepts the attached logo file).
Wire the root layout, metadata defaults and the soft route fade transition.
Keyboard and screen reader test the mobile menu. Report contrast results for header and footer.
Branch phase-2-layout.
```

## Phase 3: Motion primitives

```
Phase 3: motion system. Plan mode first.

Build src/lib/motion.ts (easing, durations, variants) and the components Reveal, SplitHeading (line mask reveal), Stagger, ParallaxImage (clip-path reveal plus max 40px parallax), Magnetic (desktop only, max 8px), and a CursorFollower for the "View" label.
All must degrade gracefully under prefers-reduced-motion and on touch devices.
Create a temporary /dev/motion route that demos each primitive, and remove it before the PR.
Document usage in README under "Motion guide".
Branch phase-3-motion.
```

## Phase 4: Sections A (hero to value props)

```
Phase 4: homepage sections 3 to 5 of CLAUDE.md, plus the hero. Plan mode first.

Build Hero (video with poster, metadata preload, data saver fallback, headline line reveal with italic emphasis, Shop Now CTA, scroll indicator), TaglineStrip, ValueProps.
Apply the visual direction: grain, dithered duotone decoration, bamboo SVG accent that sways subtly, brown frame motif. Use the torn paper reveal as the hero to next section transition only if it stays performant on mobile; otherwise propose an alternative.
Copy comes from src/content. Mobile first. Lighthouse check on the hero and report numbers.
Branch phase-4-sections-a.
```

## Phase 5: Sections B (process and services)

```
Phase 5: HowItWorks and ServicesGrid. Plan mode first.

HowItWorks: sticky left column with the drawing illustration, 5 steps scrolling on the right, step number and active highlight tied to scroll progress, collapses to a simple stacked layout on mobile.
ServicesGrid: 6 cards with lift, icon sway, link to service routes, staggered reveal.
Add the perforated stamp edge mask to one featured image and the lace or botanical frame to one featured card, nowhere else.
Branch phase-5-sections-b.
```

## Phase 6: Sections C (banner, categories, help)

```
Phase 6: Banner, PlantsForEveryone, NeedHelp. Plan mode first.

Banner: "Predict the future by creating it" + Shop Now, image clip reveal.
PlantsForEveryone: 8 tiles in an offset masonry grid, all linked, zoom on hover, "View" cursor follower on desktop, staggered reveal.
NeedHelp: 3 contact cards (WhatsApp, call, email) with proper tel, mailto and wa.me links, floating WhatsApp button with 3 cycle idle pulse.
Write real alt text for every image. Branch phase-6-sections-c.
```

## Phase 7: Routes, SEO and content pages

```
Phase 7: stub routes, SEO and forms. Plan mode first.

Create all routes from CLAUDE.md with the shared layout and typed content, so nothing 404s.
Add per page metadata (clean titles and descriptions, no keyword stuffing), Open Graph with alt text, sitemap, robots, LocalBusiness JSON-LD, and canonical URLs.
Build the Contact and Consultation forms with floating labels, validation and a server action. Ask me where submissions should go before wiring delivery.
Branch phase-7-routes-seo.
```

## Phase 8: QA and hardening

```
Phase 8: QA. Run /qa and then spawn the design-reviewer subagent against the homepage at 375, 768, 1280 and 1536.

Fix every issue found. Then:
- Run Lighthouse (mobile) on the homepage and two inner pages and report scores.
- Verify reduced motion, keyboard flow, focus order and contrast for all token pairs.
- Check CLS and LCP, optimize the hero if needed.
- Produce a one page handoff in docs/HANDOFF.md: tokens, motion guide, content editing guide, known open questions for the client.
Branch phase-8-qa.
```

---

## Optional: one shot kickoff (if you prefer a single long run)

```
Read CLAUDE.md and follow it strictly. Work through PROMPTS.md phases 1 to 8 in order, one branch per phase. At the start of each phase, present the plan and wait for my approval. Stop after each phase with a short summary. Do not proceed to the next phase until I say go.
```
