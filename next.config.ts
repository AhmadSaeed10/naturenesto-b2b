import type { NextConfig } from "next";
import { redirects } from "./src/content/redirects";

// Media library uploads are served from the public base URL of the S3 compatible bucket.
function mediaPatterns(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const base = process.env.NEXT_PUBLIC_MEDIA_BASE_URL;
  if (!base) return [];
  try {
    const url = new URL(base);
    return [
      {
        protocol: url.protocol === "http:" ? "http" : "https",
        hostname: url.hostname,
        port: url.port,
        pathname: `${url.pathname.replace(/\/+$/, "")}/**`,
      },
    ];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: { remotePatterns: mediaPatterns() },
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
