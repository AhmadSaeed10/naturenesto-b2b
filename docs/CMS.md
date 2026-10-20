# Content and orders

There is no database. Content, products and settings are files in `content/`, edited in Keystatic at `/keystatic`. Every save is a Git commit to `AhmadSaeed10/naturenesto-b2b`; Vercel redeploys and the change is live in about a minute.

## Setting up Keystatic on Vercel (once)

Keystatic only creates its GitHub App from a local dev server; the live site refuses to.

1. Deploy the repo on Vercel once and note the production URL.
2. Locally, create `.env.local` with `NEXT_PUBLIC_KEYSTATIC_STORAGE=github`, run `npm run dev` and open `http://127.0.0.1:3000/keystatic`.
3. On the setup screen, enter the production URL as "Deployed App URL", leave "GitHub organization" blank, and press "Create GitHub App". On GitHub, confirm the app name and create it.
4. You land back on Keystatic, which has written `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET` and `NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` to `.env` (git ignored). Install the app on the `naturenesto-b2b` repository only.
5. On Vercel, add those four plus `NEXT_PUBLIC_KEYSTATIC_STORAGE=github` (Production and Preview) and redeploy.
6. Open `https://<site>/keystatic` and sign in with GitHub.

Sign in works on the URLs registered as callback URLs in the GitHub App (production and 127.0.0.1). To edit on another domain, add `https://<domain>/api/keystatic/github/oauth/callback` under the app's settings on GitHub.

Who can edit: anyone with write access to the GitHub repository. Add or remove editors as repository collaborators. Saves on `main` go live; editing on a branch (branch picker in Keystatic) produces a preview deploy to review first.

Locally, `npm run dev` and open `/keystatic`: it edits the files on disk, and you commit them yourself.

## What lives where

| Keystatic area | File | Drives |
| --- | --- | --- |
| Shop > Products | `content/products/<handle>.yaml` | Category pages, product pages, cart and checkout prices. Images go to `public/images/products/<handle>/` |
| Site > Store settings | `content/settings.yaml` | Announcement bar, footer email, address, copyright, WhatsApp number, social links, homepage SEO, delivery fees |
| Site > Navigation | `content/navigation.yaml` | Header links after the Shop menu, header button, footer columns |
| Site > Homepage | `content/home.yaml` | Every homepage section. "Show on the homepage" hides a section without deleting it |
| Content > Pages | `content/pages/<handle>.yaml` | `about` (its own template with an optional feature image), and `our-story`, `careers`, `shipping`, `workplace-policy` |
| Content > Blog posts | `content/posts/<handle>.yaml` | `/blogs`. No date means draft; a future date stays hidden until it passes |
| Content > Workshops | `content/workshops/<handle>.yaml` | `/workshops` |
| Content > FAQ | `content/faq.yaml` | `/faq` |
| Content > Redirects | `content/redirects.yaml` | Old addresses to new ones (the ones in `src/content/redirects.ts` run first) |

The Shop menu in the header always lists every category from `src/content/catalog.ts`.

Every read is validated. A missing or invalid value falls back to the copy in `src/content`, so a bad edit degrades one field, never the page. A page with an empty body shows its "coming soon" placeholder.

Rich text fields accept a small Markdown subset: `## heading`, `**bold**`, `*italic*`, `[link](https://...)`, `- list`, `1. list`, `> quote`. It is rendered from a parsed tree with an element allowlist, so content cannot inject HTML or scripts.

## Orders (small orders)

- The cart lives in the visitor's browser (localStorage): product handles and quantities only.
- Checkout asks for phone, optional email, address, city and delivery area (Lahore, rest of Punjab, rest of Pakistan). Payment is cash on delivery.
- The server re-prices every order from `content/products` and the delivery fees in Store settings. Prices sent by the browser are never trusted.
- Each order gets a reference such as `NN-7F3K2Q`. With Resend configured it is emailed to `ORDER_EMAIL_TO` (reply goes to the customer), and a copy goes to the customer if they gave an email.
- The confirmation always offers "Send order on WhatsApp" with the order written out. Without Resend, that is the only way the store receives it, and the page says so.
- There is no stock tracking or order dashboard. Mark a product out of stock in Keystatic to stop sales.

## Bulk and business orders

Every product page has "Request bulk pricing" under Add to cart. It collects company (optional), name, phone, email, quantity, city and timeline, and emails the store. Without Resend it hands the request to WhatsApp instead. Contact and consultation forms use the same email path.

## Placeholders to confirm with the client

- Delivery: Lahore Rs 250, rest of Punjab Rs 400, rest of Pakistan Rs 600, free over Rs 15,000 (Store settings).
- All 33 products are samples (`sample: true`): names, prices and images are illustrative.
- About Us copy (Pages > About Us).
