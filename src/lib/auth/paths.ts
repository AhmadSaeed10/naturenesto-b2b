// Shared by proxy.ts, the auth actions and sign in pages so the routes stay in one place.
export const ADMIN_HOME = "/admin";
export const ADMIN_LOGIN = "/admin/login";
export const ACCOUNT_HOME = "/account";
export const ACCOUNT_LOGIN = "/account/login";

const within = (value: string, root: string): boolean =>
  value === root || value.startsWith(`${root}/`) || value.startsWith(`${root}?`);

/** Only same-origin admin paths are accepted as a post-login destination. */
export function safeAdminNext(value: string | null | undefined): string {
  if (!value || value.startsWith("//") || !within(value, ADMIN_HOME)) return ADMIN_HOME;
  return value;
}

/** Post-login destination for a magic link: an admin or account path, never elsewhere. */
export function safeNext(value: string | null | undefined): string {
  if (
    value &&
    !value.startsWith("//") &&
    (within(value, ADMIN_HOME) || within(value, ACCOUNT_HOME))
  )
    return value;
  return ADMIN_HOME;
}
