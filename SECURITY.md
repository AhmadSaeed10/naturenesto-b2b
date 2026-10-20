# Security

## Reporting

Email info@naturenesto.com. Please do not open public issues for vulnerabilities.

## Threat model

| Asset             | Threat                             | Control                                                                                                                                                                                                  |
| ----------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Content (CMS)     | Unauthorised edits                 | Keystatic in GitHub mode: only GitHub users with write access to the repository can save. Every change is a commit with an author, reviewable and revertible                                             |
| Keystatic secrets | Leak to the browser                | `KEYSTATIC_GITHUB_CLIENT_SECRET` and `KEYSTATIC_SECRET` are server only (no `NEXT_PUBLIC_` prefix) and live only in Vercel env                                                                           |
| Stored content    | Script injection through rich text | Rich text is a Markdown subset rendered from a parsed tree with an element allowlist; unsafe link schemes are dropped. Link fields are validated against a site path, https, mailto or tel pattern       |
| Checkout          | Price manipulation                 | The browser sends handles and quantities only. The server re-prices from `content/products` and the delivery settings, and validates every field with zod                                                |
| Emails            | Header or markup injection         | Sent through Resend's HTTP API as plain text; reply-to is set only when it parses as an email address. `RESEND_API_KEY` is server only                                                                   |
| Forms             | Spam                               | Honeypot field on checkout, bulk, contact and consultation forms. There is no rate limiting without a database: add Vercel Firewall rate limits on POST to `/checkout` and product pages if spam appears |
| Orders            | Exposure of customer details       | Orders are not stored on the site. They exist only in the store inbox and WhatsApp. Cart, checkout and `/keystatic` are noindex and disallowed in robots.txt                                             |

## Known gaps

- No server side rate limiting (see Forms above).
- No order database: a lost email or unsent WhatsApp message means a lost order. The confirmation page always offers the WhatsApp handoff for that reason.
