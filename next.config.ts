import type { NextConfig } from "next";
import { redirects } from "./src/content/redirects";

const nextConfig: NextConfig = {
  // Keystatic's local GitHub setup redirects to 127.0.0.1; let the dev server serve it.
  allowedDevOrigins: ["127.0.0.1"],
  cacheComponents: true,
  // Keystatic content is read from disk at runtime by server functions on Vercel.
  outputFileTracingIncludes: { "/**": ["./content/**/*"] },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  redirects() {
    return redirects;
  },
};

export default nextConfig;
