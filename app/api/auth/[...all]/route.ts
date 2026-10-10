import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/auth/server";

// Better Auth's HTTP API, served on the dashboard host only (proxy.ts). The API-key routes are
// disabled in auth/server.ts; our own server code manages child device keys.
export const { GET, POST } = toNextJsHandler(auth);
