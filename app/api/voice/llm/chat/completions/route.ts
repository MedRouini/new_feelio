// ElevenLabs treats the custom-LLM URL as an OpenAI base URL and appends /chat/completions (seen in the
// M5 live test, 2026-10-11). Same handler, same checks.
export { POST } from "../../route";

export const runtime = "nodejs";
export const maxDuration = 30;
