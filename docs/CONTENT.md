
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
