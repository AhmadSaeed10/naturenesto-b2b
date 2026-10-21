import "server-only";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins";
import { getPool } from "@/lib/db";
import { sendEmail, signInEmail } from "@/lib/email";

const snake = {
  createdAt: "created_at",
  updatedAt: "updated_at",
} as const;

function createAuth() {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("BETTER_AUTH_SECRET must be set to at least 32 characters. See docs/NEON.md.");
  }
  const baseURL =
    process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return betterAuth({
    secret,
    baseURL,
    // Vercel preview deployments get their own host; allow them to sign in.
    trustedOrigins: ["https://*.vercel.app", "http://localhost:*"],
    database: getPool(),
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: 10,
      maxPasswordLength: 128,
    },
    user: { modelName: "auth_user", fields: { emailVerified: "email_verified", ...snake } },
    session: {
      modelName: "auth_session",
      fields: {
        expiresAt: "expires_at",
        ipAddress: "ip_address",
        userAgent: "user_agent",
        userId: "user_id",
        ...snake,
      },
    },
    account: {
      modelName: "auth_account",
      fields: {
        accountId: "account_id",
        providerId: "provider_id",
        userId: "user_id",
        accessToken: "access_token",
        refreshToken: "refresh_token",
        idToken: "id_token",
        accessTokenExpiresAt: "access_token_expires_at",
        refreshTokenExpiresAt: "refresh_token_expires_at",
        ...snake,
      },
    },
    verification: { modelName: "auth_verification", fields: { expiresAt: "expires_at", ...snake } },
    advanced: { database: { generateId: "uuid" } },
    plugins: [
      magicLink({
        // Accounts are created by our own code after an invite check, never by the link itself.
        disableSignUp: true,
        expiresIn: 60 * 60, // matches the admin copy: "expires in one hour"
        sendMagicLink: async ({ email, url }) => {
          await sendEmail({ to: email, ...signInEmail(url) });
        },
      }),
      nextCookies(), // must stay last
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;

const globalForAuth = globalThis as unknown as { __naturenestoAuth?: Auth };

/** Created on first use so builds and pages that never sign in need no auth secret. */
export function getAuth(): Auth {
  globalForAuth.__naturenestoAuth ??= createAuth();
  return globalForAuth.__naturenestoAuth;
}

export function isAuthConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL && (process.env.BETTER_AUTH_SECRET?.length ?? 0) >= 32);
}
