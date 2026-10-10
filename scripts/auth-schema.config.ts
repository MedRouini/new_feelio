// Used only to generate platform/db/schema/auth.ts with the Better Auth CLI.
// Keep the plugin list identical to auth/server.ts.
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { apiKey } from "@better-auth/api-key";

export const auth = betterAuth({
  database: drizzleAdapter({} as never, { provider: "pg" }),
  emailAndPassword: { enabled: true },
  rateLimit: { enabled: true, storage: "database" },
  telemetry: { enabled: false },
  plugins: [apiKey({ configId: "child-device", enableMetadata: true })],
});
