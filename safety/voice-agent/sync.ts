// Feelio's ElevenLabs voice agent, defined in code (ARCHITECTURE §4.2, D-068). Creates or updates the
// workspace secret the agent sends to our proxy, the client tools, and the agent itself. Lives under
// safety/ because it calls a provider.
//
//   npx tsx safety/voice-agent/sync.ts          → dry run: prints what it would send (no secret values)
//   npx tsx safety/voice-agent/sync.ts --yes    → applies it; writes ELEVENLABS_AGENT_ID to .env on create
//
// Re-run whenever VOICE_PUBLIC_URL changes (a new tunnel) or this file changes.
// API shapes checked 2026-10-11 (docs: agents/create, tools/create, custom-llm, dynamic-variables).
//
// The agent never talks to an LLM directly: its "custom LLM" is our safety proxy (CLAUDE.md rule 1).
// Its own prompt is unused (the proxy drops system text and builds its own).
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { MODEL_TOOLS, TOOL_DEFS, type ToolName } from "./tools";

const BASE = "https://api.elevenlabs.io/v1";
const SECRET_NAME = "feelio_voice_proxy";
const AGENT_NAME = "Feelio (voice companion)";
/**
 * Turbo, the owner's choice for smooth, low-latency speech (D-068). ElevenLabs requires the v2 models
 * for English-only agents ("English Agents must use turbo or flash v2", checked 2026-10-11); Turbo v2.5
 * comes back with Arabic, when the agent becomes multilingual.
 */
const TTS_MODEL = "eleven_turbo_v2";
/** The opening line. Fixed, reviewed, and it says plainly that Feelio is an AI (CLAUDE.md rule 8). No name. */
const FIRST_MESSAGE = "Hi, I'm Feelio! I'm an AI friend, not a person. How are you feeling today?";
/** Backstop only: our own per-session limit (the session gate) is shorter and ends the call first. */
const MAX_DURATION_S = 300;
const CLIENT_TOOLS: ToolName[] = [...MODEL_TOOLS, "show_safety_resources", "show_story_choice"];

function loadEnv() {
  if (!existsSync(".env")) return;
  for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const i = line.indexOf("=");
    if (i > 0 && !(line.slice(0, i) in process.env)) process.env[line.slice(0, i)] = line.slice(i + 1);
  }
}

function need(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set (see .env.example)`);
  return v;
}

async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "xi-api-key": need("ELEVENLABS_API_KEY"), "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  // Error bodies describe the request shape (validation), never our secrets.
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${text.slice(0, 1500)}`);
  return (text ? JSON.parse(text) : {}) as T;
}

async function syncSecret(): Promise<string> {
  const value = need("VOICE_PROXY_SECRET");
  const list = await api<{ secrets: { secret_id: string; name: string }[] }>("GET", "/convai/secrets");
  const found = list.secrets.find((s) => s.name === SECRET_NAME);
  if (found) {
    await api("PATCH", `/convai/secrets/${found.secret_id}`, { type: "update", name: SECRET_NAME, value });
    console.log(`secret ${SECRET_NAME}: updated`);
    return found.secret_id;
  }
  const made = await api<{ secret_id: string }>("POST", "/convai/secrets", { type: "new", name: SECRET_NAME, value });
  console.log(`secret ${SECRET_NAME}: created`);
  return made.secret_id;
}

function toolConfig(name: ToolName) {
  return {
    type: "client",
    name,
    description: TOOL_DEFS[name].description,
    parameters: TOOL_DEFS[name].parameters,
    // Screen-only and non-blocking: the conversation never waits for the app.
    expects_response: false,
  };
}

async function syncTools(): Promise<string[]> {
  const list = await api<{ tools: { id: string; tool_config: { name: string } }[] }>("GET", "/convai/tools");
  const ids: string[] = [];
  for (const name of CLIENT_TOOLS) {
    const found = list.tools.find((t) => t.tool_config.name === name);
    if (found) {
      await api("PATCH", `/convai/tools/${found.id}`, { tool_config: toolConfig(name) });
      ids.push(found.id);
      console.log(`tool ${name}: updated`);
    } else {
      const made = await api<{ id: string }>("POST", "/convai/tools", { tool_config: toolConfig(name) });
      ids.push(made.id);
      console.log(`tool ${name}: created`);
    }
  }
  return ids;
}

function agentBody(proxyUrl: string, secretId: string, toolIds: string[]) {
  return {
    name: AGENT_NAME,
    tags: ["feelio", "adult-testing"],
    conversation_config: {
      agent: {
        first_message: FIRST_MESSAGE,
        language: "en",
        prompt: {
          prompt: "Unused: Feelio's words come from the Feelio safety proxy.",
          llm: "custom-llm",
          custom_llm: {
            url: proxyUrl,
            model_id: "feelio-safety",
            api_key: { secret_id: secretId },
            // No headers: dynamic variables aren't substituted here (M5 live test); the session id travels in the body.
            request_headers: {},
            api_type: "chat_completions",
          },
          // Never fall back to a hosted model that would bypass the safety layer.
          backup_llm_config: { preference: "disabled" },
          cascade_timeout_seconds: 8,
          ignore_default_personality: true,
          tool_ids: toolIds,
          built_in_tools: { end_call: { name: "end_call", description: "", params: { system_tool_type: "end_call" } } },
        },
      },
      tts: { model_id: TTS_MODEL, voice_id: need("ELEVENLABS_VOICE_ID_EN"), stability: 0.5, similarity_boost: 0.8, speed: 1 },
      turn: { turn_timeout: 7, silence_end_call_timeout: 30 },
      conversation: {
        max_duration_seconds: MAX_DURATION_S,
        // What the app hears: audio and words for the screen, and the client tool calls. No extra data.
        client_events: ["audio", "interruption", "agent_response", "user_transcript", "agent_response_correction", "client_tool_call"],
      },
    },
    platform_settings: {
      // Only tokens minted by our session gate can start a conversation.
      auth: { enable_auth: true },
      // No recordings; transcripts are not kept longer than needed (data minimisation, CLAUDE.md rule 6).
      privacy: { record_voice: false, retention_days: 0, delete_audio: true },
      // The only client override: the app passes our session id to the proxy (elevenlabs_extra_body).
      // Prompt, LLM, voice, first message and duration overrides all stay off (client values can be tampered with).
      overrides: { custom_llm_extra_body: true, conversation_config_override: { conversation: { text_only: false } } },
    },
  };
}

async function main() {
  loadEnv();
  const go = process.argv.includes("--yes");
  const publicUrl = need("VOICE_PUBLIC_URL").replace(/\/$/, "");
  if (!publicUrl.startsWith("https://")) throw new Error("VOICE_PUBLIC_URL must be https");
  const proxyUrl = `${publicUrl}/api/voice/llm`;
  const existing = process.env.ELEVENLABS_AGENT_ID;

  console.log(`${existing ? "Update" : "Create"} agent "${AGENT_NAME}": custom LLM ${proxyUrl}, TTS ${TTS_MODEL}, ${CLIENT_TOOLS.length} client tools + end_call.`);
  if (!go) {
    console.log(JSON.stringify(agentBody(proxyUrl, "<secret_id>", CLIENT_TOOLS.map((n) => `<${n}>`)), null, 2));
    console.log("Dry run. Re-run with --yes to apply.");
    return;
  }

  const secretId = await syncSecret();
  const toolIds = await syncTools();
  const body = agentBody(proxyUrl, secretId, toolIds);
  if (existing) {
    await api("PATCH", `/convai/agents/${existing}`, body);
    console.log("agent: updated");
    return;
  }
  const made = await api<{ agent_id: string }>("POST", "/convai/agents/create", body);
  const env = readFileSync(".env", "utf8");
  const line = `ELEVENLABS_AGENT_ID=${made.agent_id}`;
  writeFileSync(".env", /^ELEVENLABS_AGENT_ID=.*$/m.test(env) ? env.replace(/^ELEVENLABS_AGENT_ID=.*$/m, line) : env.replace(/\n?$/, "\n") + line + "\n");
  console.log("agent: created (ELEVENLABS_AGENT_ID written to .env)");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
