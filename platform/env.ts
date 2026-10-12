import "server-only";
import { z } from "zod";

// Server-only environment, validated once. Secrets never leave the server (CR-3):
// nothing here is NEXT_PUBLIC_, and errors name the variable, never its value.
const schema = z.object({
  DATABASE_URL: z.string().startsWith("postgres"),
  BETTER_AUTH_SECRET: z.string().min(32),
  DATA_ENCRYPTION_KEY: z.string().min(32),
  CRON_SECRET: z.string().min(32),
  APP_ORIGIN: z.url(),
  DASHBOARD_ORIGIN: z.url(),
  DEFAULT_MARKET: z.string().default("baseline"),
  REQUIRE_EMAIL_VERIFICATION: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  ADULT_GATE_MINUTES: z.coerce.number().int().min(1).max(240).default(30),
  ADULT_GATE_SENSITIVE_MINUTES: z.coerce.number().int().min(1).max(60).default(5),
  // Providers are optional until Milestone 2; only safety/ may read them.
  ELEVENLABS_API_KEY: z.string().optional(),
  TOGETHER_API_KEY: z.string().optional(),
  // Voice proxy (Milestone 2 spike, ARCHITECTURE §4.3): the Bearer secret the ElevenLabs agent sends,
  // and an explicit switch. The spike is adult-only and off unless VOICE_SPIKE_ENABLED=1 (D-061).
  VOICE_PROXY_SECRET: z.string().min(32).optional(),
  // Feelio's voices (D-064): used for fixed lines and for story narration (D-070). Not secrets.
  ELEVENLABS_VOICE_ID_EN: z.string().optional(),
  ELEVENLABS_VOICE_ID_AR: z.string().optional(),
  // Voice companion (Milestone 5, D-068). The agent id is written by safety/voice-agent/sync.ts.
  ELEVENLABS_AGENT_ID: z.string().optional(),
  /** Public base URL ElevenLabs uses to reach /api/voice/llm (a tunnel in development, the site in production). */
  VOICE_PUBLIC_URL: z.url().optional(),
  /** Global switch (cost discipline, CR-11): "0" turns every voice session off. */
  VOICE_ENABLED: z.enum(["0", "1"]).default("1").transform((v) => v === "1"),
  /** "1" lets the owner test voice through a child profile before ElevenLabs approves use by children (D-005). */
  VOICE_ADULT_TESTING: z.enum(["0", "1"]).default("0").transform((v) => v === "1"),
  // Stories (D-070). A PRIVATE Vercel Blob store; on Vercel the connected store authenticates by OIDC,
  // elsewhere (local development, scripts) by this token. Without either, development writes to .data/.
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  /** Global switch (CR-11): "0" turns story making off everywhere (the bookshelf still opens). */
  STORIES_ENABLED: z.enum(["0", "1"]).default("1").transform((v) => v === "1"),
  // Comma-separated user ids of the safety lead(s) who may open the review queue (D-066). Never emails.
  SAFETY_LEAD_USER_IDS: z.string().optional(),
  VOICE_SPIKE_ENABLED: z
    .enum(["0", "1"])
    .default("0")
    .transform((v) => v === "1"),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const names = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Invalid or missing environment variables: ${names}. See .env.example.`);
  }
  cached = parsed.data;
  return cached;
}
