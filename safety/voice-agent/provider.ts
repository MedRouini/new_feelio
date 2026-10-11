import "server-only";
import { env } from "@/platform/env";
import { ProviderError } from "../providers/together";

// The only app code that calls the ElevenLabs Agents API at run time (CLAUDE.md rule 1; the lint rule
// allows provider hosts only under safety/). The API key stays on the server and out of errors.
// API shape checked 2026-10-11: GET /v1/convai/conversation/token?agent_id= → { token } for WebRTC;
// the agent has enable_auth, so a session can't start without a token we minted.

const BASE = "https://api.elevenlabs.io/v1";

export function voiceConfigured(): boolean {
  const e = env();
  return Boolean(e.ELEVENLABS_API_KEY && e.ELEVENLABS_AGENT_ID && e.VOICE_PROXY_SECRET);
}

/** A single-use WebRTC conversation token for our agent. */
export async function conversationToken(): Promise<{ token: string; conversationId: string | null }> {
  const e = env();
  if (!e.ELEVENLABS_API_KEY || !e.ELEVENLABS_AGENT_ID) throw new ProviderError("ElevenLabs is not configured (see .env.example)");
  const res = await fetch(`${BASE}/convai/conversation/token?agent_id=${encodeURIComponent(e.ELEVENLABS_AGENT_ID)}`, {
    headers: { "xi-api-key": e.ELEVENLABS_API_KEY },
    signal: AbortSignal.timeout(5000),
    cache: "no-store",
  });
  if (!res.ok) throw new ProviderError(`ElevenLabs token returned ${res.status}`, res.status);
  const data = (await res.json()) as { token?: string; conversation_id?: string };
  if (!data.token) throw new ProviderError("ElevenLabs token missing");
  return { token: data.token, conversationId: data.conversation_id ?? null };
}
