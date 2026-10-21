# Neon database

The database moves from Supabase to Neon Postgres, on free tiers. This file is the working reference for the move. It grows with each phase.

## Phases

| Phase | What | Status |
| --- | --- | --- |
| 1. Foundation | Connection, migrations as plain Postgres, seed, behaviour tests, CI | Done |
| 2. Auth | Staff and customer sign in, invites, roles (Better Auth, emails through Resend) | Next |
| 3. Data layer | Every read and write in `src/lib` and `src/app/actions` moves from Supabase to Neon | Planned |
| 4. Media | Uploads and public URLs move off Supabase Storage | Planned |
| 5. Cleanup | Remove `@supabase/*`, `supabase/`, legacy env vars and docs | Planned |
| 6. Admin panel | Verify every area on Neon, then orders, customers and dashboard | Planned |

Until phase 3 lands the running app still reads from Supabase. Nothing in phase 1 changes what the storefront or admin shows.

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

## Commands

| Command | What it does |
| --- | --- |
| `npm run db:check` | Connects with both strings, and with the app driver (`@neondatabase/serverless`) on Neon |
| `npm run db:migrate` | Applies pending migrations. `-- --status` lists applied and pending without changing anything |
| `npm run db:seed` | Applies `db/seed.sql` |
| `npm run db:smoke` | Behaviour checks in a rolled back transaction. Local databases only unless `--allow-remote` |
| `npm run seed:generate` | Rebuilds `db/seed.sql` from `src/content` |

## Migrations

Plain SQL files in `db/migrations`, named `0001_name.sql`. Each file runs in its own transaction and is recorded in `private.schema_migrations` with a checksum. An applied file must never be edited: the runner fails if its checksum changed. Add a new numbered file instead. A lock stops two runs from interleaving.

The files are the old `supabase/migrations` ported to plain Postgres. What was dropped, and why:

- Row level security, policies, grants and Supabase roles (`anon`, `authenticated`, `service_role`). Neon has one application role.
- `auth.users` foreign keys. The columns remain (`profiles.id`, `created_by`, `actor_id`, `customers.user_id`) as plain uuids. Phase 2 adds the foreign keys once the auth tables exist.
- The `storage.*` bucket and policies. Phase 4 replaces them.
- The `on_auth_user_created` trigger. Linking an invite to a profile moves into the auth layer in phase 2. The `staff_invites` table stays.
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
