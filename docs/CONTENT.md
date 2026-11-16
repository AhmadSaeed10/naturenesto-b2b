
## Phase 20: stand-in photography and catalogue

- Photos are hotlinked from Unsplash (free under the Unsplash License). Source of truth: `src/content/photos.ts`, each entry has alt text and photographer credit. Replace with the studio's own photography before launch, or download and upload through admin Media.
- Catalogue: `src/content/catalogue.ts` (41 products). Names are common Pakistan market plants, pots and care items. **Prices are PKR market-range placeholders (inferred). Confirm every price, size, stock status and the "Care guidance for your plant" included line with the client.**
- Some photos are approximate matches for the species (orchid trio, hoya trio, motia jasmine). Review once.
- Load into the database: `npm run db:seed`, then `npm run db:demo -- --force` to activate new draft products.

## Phase 21: product pages and shop
- Every product shows up to four frames: its own photo, species extras, then shared styling frames (room, pot detail, care) from `src/content/photos.ts`, rotated per product (`withGallery` in `catalogue.ts`). Stand-ins, replace with the studio's own photography.
- Cards show rating and review count only where published reviews exist, and "Save n%" when a compare-at price is set.
- New `/shop` page lists all products with category, price band, light, pet, care level, in stock filters, search and sorts. Price bands and wording in `src/content/shop.ts` are new, client to confirm.
- Run `npm run db:seed` on Neon to load the new galleries.

## Phase 22: footer page sections (all invented, client to confirm)
Source: `src/content/pages-extra.ts`. Nothing here was supplied by the client.
- Stats (5+ years, 2,000+ plants, 150+ spaces, 4.9 review): About, Our Story, Services. Replace with real figures or delete.
- Timeline years 2019, 2021, 2023, 2025 (Our Story) and the founder quote.
- Team cards are roles only, no names; photos are plant stand-ins. Add real names and portraits.
- Three testimonials (Ayesha K., Hamza R., Sana M.) are placeholders. Use real reviews with permission or remove.
- Careers perks (learning budget, flexible hours, plant allowance) and the four hiring steps.
- Workshop "what to expect" steps, blog topics, shipping facts and steps, policy facts, studio hours (Mon to Sat, 10 am to 7 pm). Delivery and policy wording must match the real policy.

## Phase 23: typography
Baskervville is now the only font, weights 400 and 500, scale in `src/lib/tokens.ts`. Confirm the look on the Vercel preview; the sandbox could not load Google Fonts.

## Phase 24: marketplace structure (all inferred, client to confirm)
Drafted from the strategy chat "Where Nature Meets Living". Nothing here was supplied by the client.
- Homepage sections after the hero (`src/content/home-world.ts`): intro, Explore Our World, solutions, marketplace band, Shop by Space, featured projects, Why Nature Nesto, final CTA. Code driven, not editable in admin.
- Solutions (`src/content/solutions.ts`), Shop by Space product lists (`src/content/spaces.ts`), marketplace copy (`src/content/marketplace.ts`).
- Projects (`src/content/projects.ts`): six placeholder projects with stand-in photos. No real project data exists.
- Water & Aquatic Living and Birds & Nature are Coming Soon only (live animals need separate logistics and regulations).
- The header menu is now code driven (`headerGroups` in `src/content/nav.ts`); the admin header menu no longer controls it.
- The seed never overwrites existing rows. After deploying, run `npm run db:refresh-home` once to apply the new hero and home SEO (it replaces hero edits made in admin).
