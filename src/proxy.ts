import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";
import { ACCOUNT_HOME, ACCOUNT_LOGIN, ADMIN_HOME, ADMIN_LOGIN } from "@/lib/auth/paths";

/**
 * First gate only: signed out visitors are sent to the login page. It checks that a session
 * cookie exists, not that it is valid. The admin layout and every action verify the session
 * and the staff role on the server.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isLogin = pathname === ADMIN_LOGIN || pathname === ACCOUNT_LOGIN;
  const isAdmin = pathname === ADMIN_HOME || pathname.startsWith(`${ADMIN_HOME}/`);
  const isAccount = pathname === ACCOUNT_HOME || pathname.startsWith(`${ACCOUNT_HOME}/`);
  if (isLogin || !(isAdmin || isAccount)) return NextResponse.next();

  if (!getSessionCookie(request)) {
    const login = new URL(isAccount ? ACCOUNT_LOGIN : ADMIN_LOGIN, request.url);
    login.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/account", "/account/:path*"],
};
