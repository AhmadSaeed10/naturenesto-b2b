# Admin and backend

The database (Neon Postgres, see docs/NEON.md) is the source of truth for products, content, media, leads and, from Stage E, orders and customers. The admin lives at `/admin`. This file grows with each Phase 9 stage.

## Roles

| Role | Can do |
| --- | --- |
| Owner | Everything, including staff and roles. Only an owner can create or change another owner |
| Admin | Everything except touching owners |
| Editor | Catalogue, collections, media and content (pages, blog, workshops, FAQ, navigation). No leads, settings or staff |
| Support | Leads and quotes now; orders and customers from Stage F. Read only on the catalogue |

Roles are enforced three times: `proxy.ts` (signed in), the admin layout (`requireStaff()`), and row level security on every table (the final guard). Every insert, update and delete on admin tables is written to `audit_log` by a trigger, with the actor and before and after values.

## Adding staff

There is no public sign up. Owners and admins invite people in **Settings > Staff** (email and role). The person then opens `/admin/login`, enters the email and leaves the password empty. The server checks the invite, creates the account and emails a sign in link. The role is applied on first sign in.

- **Change role** or **Remove access** from the same list. Removing access also clears the invite, so signing in again does not bring the role back. There must always be at least one owner.
- Admins cannot invite, change or remove owners.
- Passwords are optional: anyone can set one in **Settings > Your account**.

## Admin areas built so far

| Area | Who | What |
| --- | --- | --- |
| Media (`/admin/media`) | Owner, admin, editor | Upload images straight to the `media` bucket (photos over 2560 px are resized in the browser), search, rename, edit alt text, copy link, delete. Alt text is required unless an image is marked decorative. An image in use (product, collection, cover, logo) cannot be deleted; the card shows where it is used |
| Settings > Store | Owner, admin | Store details, contact numbers, announcement bar, social links, SEO defaults, logo. Saved to `site_settings`; the storefront reads them from Stage D |
| Settings > Shipping & payments | Owner, admin | Delivery zones (cities, fee, free delivery threshold), tax (rate, whether prices include it) and payment methods (show at checkout, name, instructions). Checkout uses the new values straight away |
| Settings > Staff | Owner, admin | Invite, change role, remove access, cancel invites |
| Settings > Your account | Everyone | Set a password |

| Products (`/admin/products`) | Owner, admin, editor | Search (title, handle, SKU; also from the sidebar), filter by status and collection, bulk status changes, soft delete and restore, inline status. Editor with options (up to three) and generated variants, prices in PKR, images from the media library (drag, or move buttons), tags, manual collections, categories and SEO. Duplicate creates a draft copy. CSV export and import |
| Collections (`/admin/collections`) | Owner, admin, editor | Manual collections (pick and order products) and automatic ones (tag, type or vendor conditions, all must match). Categories tab for a nested category tree |
| Inventory (`/admin/inventory`) | Owner, admin, editor | Stock per tracked variant, filters for low and out of stock, adjustments with a reason and note, recent changes log |

| Content (`/admin/content`) | Owner, admin, editor (redirects: owner, admin) | Homepage sections, pages, blog, workshops, FAQ, navigation menus and redirects |

## Checkout (Stage E)

- **Storefront flow:** product page (`/products/<handle>`), cart (`/cart`), checkout (`/checkout`), confirmation (`/orders/<number>`). Category tiles link to product pages once real products are active; sample products keep the WhatsApp enquiry.
- **Guests** check out with email and phone. The confirmation link carries a private token, so only the buyer can open it. **Customers** can sign in at `/account/login` with an emailed link (no password) to see all orders with that email and save addresses. Guest orders join the account automatically when the same email signs in.
- **Pricing** happens in the database (`cart_totals`), so the checkout preview and the placed order always agree. `place_order` runs in one transaction: it locks the variants, refuses oversells, applies the discount, decrements stock (logged in Inventory as "sold") and records the pending payment.
- **Placeholders to confirm with the client:** delivery Lahore Rs 250, rest of Punjab Rs 400, rest of Pakistan Rs 600, free over Rs 15,000. GST 0 percent and included in prices. Cash on delivery on; bank transfer off. Edit them in Settings > Shipping & payments.
- Card payments arrive in Stage G with the chosen gateway. No card data is ever stored.
- Checkout needs `DATABASE_URL` on Vercel. Without them the cart icon is hidden and product pages show the WhatsApp enquiry only.

## How to edit content

The database is the source of truth for storefront content. Every read falls back to the copy in `src/content` when the database is unreachable or a block is invalid, so the site never renders empty. Saves revalidate the matching cache tag, so changes are live within moments with no redeploy.

- **Homepage** (Content > Homepage): open a section, edit it, **Save draft**, then **Preview** (opens `/preview`, staff only, with drafts applied) and **Publish**. The live homepage only changes on publish. **Hide section** removes it from the homepage without deleting it. Drafts are stored in `page_section_drafts`, which only content staff can read.
- **Pages** (Content > Pages): a published page with the handle `about`, `our-story`, `careers`, `shipping` or `workplace-policy` replaces that page's placeholder. Handles used by real routes (for example `contact` or `services`) are refused.
- **Blog, workshops, FAQ**: `/blogs`, `/workshops` and `/faq` show the placeholder until the first item is published. A blog post with a future publish date stays hidden until then.
- **Navigation**: the header links, the header button and the three footer columns.
- **Redirects** (owners and admins): old address to new one. The redirects in `src/content/redirects.ts` run first; admin redirects apply to any other unknown address.
- **Settings > Store** now drives the announcement bar, footer address, email, social links, the WhatsApp button and the homepage title and description.

Rich text uses a small Markdown subset (`## heading`, `**bold**`, `*italic*`, `[link](https://...)`, `- list`, `1. list`, `> quote`). The editor has buttons for each and a preview tab. It is rendered from a parsed tree with an element allowlist, so stored content cannot inject HTML or scripts; unsafe links (`javascript:` and similar) are dropped.

## How to add a product

1. Upload its photos in **Media** (with alt text).
2. **Products > Add product**: title (the handle fills in), description, images, and options if it comes in sizes or colours, then **Update variants from options**.
3. Set each variant's price and starting stock. Add tags that match the storefront categories (`indoor-plants`, `pet-friendly`, `easy-care`, `orchids`, `large-plants`, `low-light`, `plant-care`, `outdoor-plants`, `pots-and-planters`) and badges as `badge:new`, `badge:pet-safe`, `badge:low-light`, `badge:easy-care` or `badge:bestseller`.
4. Set status to **Active** and save. The category pages switch from the sample catalogue to live products as soon as a category has an active product.

Stock never changes silently: the editor sets starting stock once, and every later change goes through **Inventory** (or a CSV import) and is logged in `inventory_adjustments`.

## CSV format

One row per variant, grouped by `Handle`. Product fields are read from the first row of each handle. Existing products are matched by handle and variants by SKU (or variant title when there is no SKU); a different `Stock` value is logged as an import adjustment. Prices are rupees. Images, collections and categories are not part of the file and are kept as they are. Cells starting with `=`, `+`, `-` or `@` are prefixed with `'` on export so spreadsheets do not run them as formulas.

## Sign in (Better Auth)

Staff and customers sign in with an emailed link (staff can also set a password). Accounts live in the `auth_*` tables in Neon. Staff access is by invite only: an email can sign in only if it has a row in `staff_invites` or a profile with a role. Public sign up is closed.

First owner: `npm run auth:owner -- you@example.com`, then sign in at `/admin/login` with that email. More staff are invited from Settings > Staff.

Without `RESEND_API_KEY` (development) the sign in link is printed in the server terminal. In production the key and a verified sending domain are required, or no link can be delivered.

## Environment variables

See `.env.example`. In Vercel (Production and Preview): `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_SITE_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, and for media `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `NEXT_PUBLIC_MEDIA_BASE_URL`. In GitHub Actions secrets: `DATABASE_URL_UNPOOLED` (used by the Migrate workflow). The direct database string never goes to Vercel.

Without the database variables the storefront still works on the sample catalogue and `/admin/login` shows that sign in is not available.

## Migrations

All schema lives in `db/migrations`, committed to git. No console schema edits.

1. Write a new file `db/migrations/<next number>_<name>.sql`. Applied files are never edited.
2. Open a PR. CI starts a throwaway Postgres, applies every migration and the seed, and runs `npm run db:smoke`.
3. On merge to main, the Migrate workflow runs `npm run db:migrate` against Neon. Migrations already applied are skipped.

Rules: there is no row level security. Every admin action checks the role with `requireStaff` or `staffWithRole`, and writes go through `withActor` so the audit log records who did them. Tables keep `updated_at` and audit triggers (copy the loops in the catalog migration). Money is stored in paisa (PKR x 100).

Types come from `src/lib/db/schema.ts` (Drizzle). After a schema change update it by hand, or run `npx drizzle-kit pull` against a scratch database and copy the changed tables.

## Seed

`npm run seed:generate` writes `db/seed.sql` from `src/content` (settings, navigation, homepage sections, services, the nine category collections, redirects and the sample products as drafts). CI fails if the file is out of date. The seed is idempotent (`npm run db:seed`). It never contains staff emails.

The sample products are drafts, so the storefront keeps showing the sample catalogue until real products are set to active.

## Restoring a backup

Neon keeps a short history window on the free plan (check the console under Backup & Restore). Export the catalogue any time from Products > Export CSV.
