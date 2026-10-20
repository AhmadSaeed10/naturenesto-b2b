import type { NextConfig } from "next";
import { redirects } from "./src/content/redirects";

const nextConfig: NextConfig = {
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
