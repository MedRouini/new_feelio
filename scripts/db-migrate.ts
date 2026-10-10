// Applies committed migrations in drizzle/ to DATABASE_URL. Prints no connection details.
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

function loadEnv() {
  if (process.env.DATABASE_URL) return;
  for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const i = line.indexOf("=");
    if (i > 0 && !process.env[line.slice(0, i)]) process.env[line.slice(0, i)] = line.slice(i + 1);
  }
}

async function main() {
  loadEnv();
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set (see .env.example)");
  await migrate(drizzle(neon(url)), { migrationsFolder: "./drizzle" });
  console.log("Migrations applied.");
}

main().catch((e) => {
  console.error("Migration failed:", e instanceof Error ? e.message.replace(/postgres(ql)?:\/\/\S+/g, "<redacted>") : e);
  process.exit(1);
});
