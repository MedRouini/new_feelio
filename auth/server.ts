import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { apiKey } from "@better-auth/api-key";
import { db } from "@/platform/db/client";
import * as schema from "@/platform/db/schema";
import { env } from "@/platform/env";
import { CHILD_DEVICE_CONFIG_ID, CHILD_DEVICE_KEY_DAYS } from "./constants";

// Parent accounts only. Children never have credentials (SPEC §3.1).
// The auth handler is served on the dashboard host only (proxy.ts, D-032).
export const auth = betterAuth({
  appName: "Feelio",
  baseURL: `${env().DASHBOARD_ORIGIN}/api/auth`,
  secret: env().BETTER_AUTH_SECRET,
  trustedOrigins: [env().DASHBOARD_ORIGIN],
  database: drizzleAdapter(db, { provider: "pg", schema, transaction: false }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    // Needs an email provider, not chosen yet (asked in M1). Off in development; see docs/PLACEHOLDERS.md.
    requireEmailVerification: env().REQUIRE_EMAIL_VERIFICATION,
  },
  session: {
    expiresIn: 60 * 60 * 24, // 1 day
    updateAge: 60 * 60, // refresh at most hourly
    freshAge: 60 * 5, // Better Auth's own sensitive endpoints need a session younger than 5 min
  },
  rateLimit: {
    enabled: true,
    storage: "database", // serverless instances don't share memory
    window: 60,
    max: 60,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 3 },
    },
  },
  advanced: {
    cookiePrefix: "feelio",
    useSecureCookies: env().DASHBOARD_ORIGIN.startsWith("https://"),
    // Host-only cookies: the parent session never reaches the child app host.
    crossSubDomainCookies: { enabled: false },
  },
  telemetry: { enabled: false },
  // Our own server code creates, lists and revokes device keys; the plugin's HTTP routes are not exposed.
  disabledPaths: [
    "/api-key/create",
    "/api-key/update",
    "/api-key/delete",
    "/api-key/list",
    "/api-key/get",
    "/api-key/delete-all-expired-api-keys",
  ],
  plugins: [
    apiKey({
      configId: CHILD_DEVICE_CONFIG_ID,
      defaultPrefix: "fk_",
      // Keys are stored as SHA-256 hashes (plugin default, verified 2026-10-10). Never disable.
      disableKeyHashing: false,
      enableMetadata: true,
      // A child key must never act as the parent (SPEC §7).
      enableSessionForAPIKeys: false,
      keyExpiration: {
        defaultExpiresIn: CHILD_DEVICE_KEY_DAYS * 24 * 60 * 60 * 1000,
        disableCustomExpiresTime: true,
      },
      rateLimit: { enabled: true, timeWindow: 60 * 1000, maxRequests: 300 },
      startingCharactersConfig: { shouldStore: true, charactersLength: 7 },
    }),
    nextCookies(), // must stay last
  ],
});

export type Auth = typeof auth;
