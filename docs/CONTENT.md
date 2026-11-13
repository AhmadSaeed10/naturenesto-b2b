
## Phase 20: stand-in photography and catalogue

- Photos are hotlinked from Unsplash (free under the Unsplash License). Source of truth: `src/content/photos.ts`, each entry has alt text and photographer credit. Replace with the studio's own photography before launch, or download and upload through admin Media.
- Catalogue: `src/content/catalogue.ts` (41 products). Names are common Pakistan market plants, pots and care items. **Prices are PKR market-range placeholders (inferred). Confirm every price, size, stock status and the "Care guidance for your plant" included line with the client.**
- Some photos are approximate matches for the species (orchid trio, hoya trio, motia jasmine). Review once.
- Load into the database: `npm run db:seed`, then `npm run db:demo -- --force` to activate new draft products.
