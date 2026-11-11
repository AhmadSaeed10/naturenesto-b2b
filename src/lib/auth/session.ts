import "server-only";
import { headers } from "next/headers";
import { connection } from "next/server";
import { cache } from "react";
import { getAuth, isAuthConfigured } from "./server";

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
}

/** The signed in user (staff or customer), deduplicated per request. Null when signed out. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  // Per request: otherwise a build without a database would prerender the signed out state.
  await connection();
  if (!isAuthConfigured()) return null;
  try {
    const session = await getAuth().api.getSession({ headers: await headers() });
    if (!session) return null;
    return {
      id: session.user.id,
      email: session.user.email.toLowerCase(),
      name: session.user.name || null,
    };
  } catch (error) {
    console.error("[auth] session lookup failed", error instanceof Error ? error.message : error);
    return null;
  }
});
