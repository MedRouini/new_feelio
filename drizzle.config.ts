import { defineConfig } from "drizzle-kit";

// Migrations are generated from the schema and committed (drizzle/). Apply with `npm run db:migrate`.
export default defineConfig({
  schema: "./platform/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
});
