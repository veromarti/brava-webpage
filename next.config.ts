import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Product images live in Cloudflare R2 (CLAUDE.md's stack table) and are
    // served from an R2 public bucket URL — either the r2.dev subdomain used
    // in dev, or a custom domain once one's connected for production.
    remotePatterns: [
      { protocol: "https", hostname: "*.r2.dev" },
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
    ],
  },
};

export default nextConfig;
