// Global teardown: removes synthetic E2E accounts (test+e2e-…, test+gate-… @example.test) even when a
// test failed before its own deletion step. Device keys first (no FK), then users (cascade).
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

export default async function cleanup() {
  if (!process.env.DATABASE_URL) {
    for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
      const i = line.indexOf("=");
      if (i > 0 && line.slice(0, i) === "DATABASE_URL") process.env.DATABASE_URL = line.slice(i + 1);
    }
  }
  if (!process.env.DATABASE_URL) return;
  const sql = neon(process.env.DATABASE_URL);
  const pattern = "test+%@example.test";
  await sql`delete from apikey where reference_id in (select id from "user" where email like ${pattern})`;
  const gone = await sql`delete from "user" where email like ${pattern} returning id`;
  if (gone.length) console.log(`E2E cleanup: removed ${gone.length} synthetic account(s).`);
}
