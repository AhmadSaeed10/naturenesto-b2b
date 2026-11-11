import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/lib/auth/server";

// Better Auth's own endpoints: magic link verification, sign out, session. The auth object is
// created per request so a missing secret fails the request, not the build.
export function GET(request: Request) {
  return toNextJsHandler(getAuth()).GET(request);
}

export function POST(request: Request) {
  return toNextJsHandler(getAuth()).POST(request);
}
