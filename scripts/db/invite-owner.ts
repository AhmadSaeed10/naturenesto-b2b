// Creates the first staff invite, so the owner can sign in with an email link.
//
//   npm run auth:owner -- you@example.com [owner|admin|editor|support]
//
// The invite turns into a staff profile the first time that email signs in. Run it once per
// database (Neon, local). It never touches existing staff.
import { fail, withClient } from "./lib.ts";

const email = process.argv[2]?.trim().toLowerCase();
const role = process.argv[3] ?? "owner";
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  fail("Usage: npm run auth:owner -- you@example.com [owner|admin|editor|support]");
}
if (!["owner", "admin", "editor", "support"].includes(role)) {
  fail("Role must be owner, admin, editor or support.");
}

await withClient(async (client) => {
  const profile = await client.query<{ role: string | null }>(
    "select role from public.profiles where lower(email) = $1",
    [email],
  );
  if (profile.rows[0]?.role) {
    console.log(`${email} is already staff (${profile.rows[0].role}). Nothing to do.`);
    return;
  }
  await client.query(
    `insert into public.staff_invites (email, role) values ($1, $2::public.staff_role)
       on conflict (lower(email)) do update set role = excluded.role, accepted_at = null`,
    [email, role],
  );
  console.log(`Invited ${email} as ${role}. Sign in at /admin/login with that email.`);
});
