import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  async rewrites() {
    const backend = (process.env.BACKEND_URL ?? "http://localhost:8080").replace(/\/$/, "");
    return [
      { source: "/community-data", destination: `${backend}/community-data` },
      { source: "/community-search", destination: `${backend}/community-search` },
      { source: "/community-feed", destination: `${backend}/community-feed` },
      { source: "/community-upload", destination: `${backend}/community-upload` },
      { source: "/health", destination: `${backend}/health` },
      { source: "/auth/:path*", destination: `${backend}/auth/:path*` },
      { source: "/api/:path*", destination: `${backend}/api/:path*` },
      { source: "/uploads/:path*", destination: `${backend}/uploads/:path*` },
    ];
  },
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    globalNotFound: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ytimg.com",
        pathname: "/vi/**",
      },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
