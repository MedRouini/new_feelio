import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  // D-031: Cache Components stays off. Almost every Feelio page is per-user,
  // and child data must never be cached on the server.
  cacheComponents: false,
  poweredByHeader: false,
  // The floating dev badge covers child controls (skip, dock) in development; runtime errors still
  // open the full error overlay.
  devIndicators: false,
  // Next.js security-upgrade notices for coding agents (`next upgrade --agent=security`).
  experimental: { agentUpgrade: "security" },
  // next-intl request config. Set directly instead of through next-intl's plugin, which loads
  // @swc/core for an extraction feature we don't use (D-034). Must be a relative path.
  turbopack: {
    root: process.cwd(),
    resolveAlias: { "next-intl/config": "./i18n/request.ts" },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Cross-origin requests get only our origin, never a path. Not "same-origin": that makes browsers
          // send `Origin: null` on the dashboard -> child-host device hand-off, which must be origin-checked.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self)" },
        ],
      },
    ];
  },
};

export default nextConfig;
