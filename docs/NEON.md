# Neon database

The database moves from Supabase to Neon Postgres, on free tiers. This file is the working reference for the move. It grows with each phase.

## Phases

| Phase | What | Status |
| --- | --- | --- |
| 1. Foundation | Connection, migrations as plain Postgres, seed, behaviour tests, CI | Done |
| 2. Auth and data layer | Better Auth sign in, invites, roles, every read and write on Neon through Drizzle | Done |
| 3. Media | Direct browser uploads to an S3 compatible bucket (needs a bucket, see below) | Code done, needs bucket |
| 4. Cleanup | `@supabase/*`, `supabase/`, legacy env vars and docs removed | Done |
| 5. Admin panel | Orders, customers and dashboard screens | Next |

## Setup

1. Create a Neon project (Free plan, region AWS Singapore `ap-southeast-1`).
2. In the Neon console open **Connect** and copy two strings: pooled (host has `-pooler`) and direct.
3. Put them in `.env.local` (never commit it, it is git ignored):

```
DATABASE_URL="postgresql://...-pooler.../neondb?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://.../neondb?sslmode=require"
```

4. Run:

```
npm run db:check     # both strings connect, shows host, Postgres version and migration count
npm run db:migrate   # applies db/migrations in order
npm run db:seed      # storefront content from src/content (safe to run twice)
```

For Vercel, add the same two variables to the project environment. For CI migrations on merge, add `DATABASE_URL_UNPOOLED` as a GitHub Actions secret.

## Sign in

1. Generate a secret and add it to `.env.local` next to the database strings:

```
BETTER_AUTH_SECRET="<output of: openssl rand -base64 32>"
BETTER_AUTH_URL="http://localhost:3000"
```

2. `npm run db:migrate` (creates the `auth_*` tables), then `npm run auth:owner -- you@example.com`.
3. `npm run dev`, open `/admin/login`, enter that email. With no `RESEND_API_KEY` the sign in link is printed in the terminal where `npm run dev` runs. Open it to sign in.

On Vercel set `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (the live origin) and, for real emails, `RESEND_API_KEY` and `EMAIL_FROM` (a sender on a domain verified in Resend).

## Media storage

Uploads go from the browser straight to an S3 compatible bucket using a short lived signed URL from the server (`src/lib/storage`). Any bucket with public reads works: Neon Object Storage, or Cloudflare R2 (10 GB free). Set `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` and `NEXT_PUBLIC_MEDIA_BASE_URL` (the public URL that serves the bucket). The bucket needs a CORS rule allowing `PUT` with header `Content-Type` from your site origin (and `http://localhost:3000` for development). Until it is configured the Media page shows an upload error and the storefront keeps using image URLs.

## Commands

| Command | What it does |
| --- | --- |
| `npm run db:check` | Connects with both strings and shows host, version and migration count |
| `npm run db:migrate` | Applies pending migrations. `-- --status` lists applied and pending without changing anything |
| `npm run db:seed` | Applies `db/seed.sql` |
| `npm run db:smoke` | Behaviour checks in a rolled back transaction. Local databases only unless `--allow-remote` |
| `npm run auth:owner -- email [role]` | Invites the first staff member (default role owner) |
| `npm run seed:generate` | Rebuilds `db/seed.sql` from `src/content` |

## Migrations

Plain SQL files in `db/migrations`, named `0001_name.sql`. Each file runs in its own transaction and is recorded in `private.schema_migrations` with a checksum. An applied file must never be edited: the runner fails if its checksum changed. Add a new numbered file instead. A lock stops two runs from interleaving.

The files are the old `supabase/migrations` ported to plain Postgres. What was dropped, and why:

- Row level security, policies, grants and Supabase roles (`anon`, `authenticated`, `service_role`). Neon has one application role.
- `auth.users` foreign keys. Migration `0011_auth.sql` adds the Better Auth tables and points `profiles.id`, `created_by`, `actor_id` and `customers.user_id` at `auth_user`.
- The `storage.*` bucket and policies. Phase 4 replaces them.
- The `on_auth_user_created` trigger came back in `0011_auth.sql`, on `auth_user`: a new login gets a profile, and a pending staff invite decides its role.
- `page_sections.draft`, which was added and dropped again. Drafts live in `page_section_drafts`.

## Authorisation now lives in server code

Without row level security the database no longer decides who may read or write. Server code must:

1. Check the signed in user's role (`requireStaff`) before any admin read or write.
2. Apply the visibility rules the policies used to apply: the storefront reads products that are `active` and not soft deleted, collections that are `published`, content that is `published` with `published_at` not in the future, and enabled payment methods. Staff see everything. Carts, leads, orders and customers are never read for the public.
3. Run writes through `withActor(userId, fn)` from `src/lib/db`. It sets `app.user_id` for the transaction, which the audit log, the profile role guard and `adjust_stock` read. Pass `null` for trusted server work such as checkout, rate limits and seeding.

The database still guarantees: audit rows with the real actor, the role change guard (admins cannot touch owners, nobody promotes themselves), stock never changes without a log row, and checkout pricing and stock locking inside `place_order`. `npm run db:smoke` tests these.

## Free tier limits (checked October 2026)

| Service | Free allowance | Watch for |
| --- | --- | --- |
| Neon | 1 GB storage and 100 compute hours per project, scale to zero after 5 minutes idle | First request after idle is slower. Neon's pages do not state whether the free plan may be used commercially, so read their terms before launch |
| Resend (phase 2) | 100 emails a day, 3,000 a month, 3 domains | Needs a verified sending domain |
| Neon Object Storage (phase 4) | 5 GB per project | Public URLs and browser uploads are tested in phase 4. Cloudflare R2 (10 GB free) is the fallback |
| Vercel Hobby | Free | Vercel limits Hobby to non commercial personal use. A live shop will need a paid plan or another host |

## Region

Use `ap-southeast-1` (Singapore) if the Neon console offers it: it is the nearest region to Lahore that I found, and one of the four regions that support Neon Object Storage. Supabase was in Mumbai.
