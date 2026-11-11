/**
 * Neon connection strings carry `sslmode=require`. node-postgres currently treats that as
 * `verify-full` and prints a security warning on every start. Saying so explicitly keeps the
 * behaviour and removes the warning. Shared by the app and the scripts in scripts/db.
 */
export function normalizeDatabaseUrl(url: string): string {
  return url.replace(/([?&])sslmode=require(?=&|$)/, "$1sslmode=verify-full");
}
