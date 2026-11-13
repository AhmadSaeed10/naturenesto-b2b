
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
