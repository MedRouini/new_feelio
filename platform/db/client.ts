import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { env } from "@/platform/env";
import * as schema from "./schema";

// Neon over HTTP: no long-lived connections, which suits serverless (CLAUDE.md).
// HTTP mode has no interactive transactions; multi-statement writes use db.batch().
export const db = drizzle(neon(env().DATABASE_URL), { schema });
export type Db = typeof db;
