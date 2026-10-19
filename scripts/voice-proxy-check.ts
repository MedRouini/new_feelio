// End-to-end check of the voice safety proxy with a bound session (D-068), without a microphone.
// Takes a synthetic test child (a household whose owner is test+…@example.test, never a real account),
// opens a short adult-test voice session row, then plays ElevenLabs' part: POSTs turns to
// /api/voice/llm with the conversation-id header and the tools the agent offers, and prints what Feelio
// would say, the tool calls, and the timing. Deletes the session row afterwards. Uses a few cents of
// Together credits; no ElevenLabs credits.
//   npx tsx --conditions=react-server scripts/voice-proxy-check.ts [baseUrl]
import { readFileSync } from "node:fs";

for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
  const i = line.indexOf("=");
  if (i > 0 && !(line.slice(0, i) in process.env)) process.env[line.slice(0, i)] = line.slice(i + 1);
}

const TURNS = process.env.VOICE_CHECK_TURNS ? (JSON.parse(process.env.VOICE_CHECK_TURNS) as string[]) : [
  "hi feelio! I drew a rocket today",
  "I'm sad because my friend didn't play with me",
  "yes, can we do the breathing game",
  "I'm bored, what can I do",
];
const OFFERED = ["end_call", "set_mascot_state", "show_feeling_card", "offer_activity", "stop_activity", "suggest_place", "show_safety_resources", "show_story_choice"];

async function main() {
  const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
  const { db } = await import("../platform/db/client");
  const { childProfile, household, voiceSession } = await import("../platform/db/schema");
  const { user } = await import("../platform/db/schema");
  const { and, eq, like } = await import("drizzle-orm");

  const [kid] = await db
    .select({ id: childProfile.id, householdId: childProfile.householdId, ageBand: childProfile.ageBand })
    .from(childProfile)
    .innerJoin(household, eq(household.id, childProfile.householdId))
    .innerJoin(user, eq(user.id, household.ownerUserId))
    .where(and(like(user.email, "test+%@example.test"), eq(childProfile.locale, "en")))
    .limit(1);
  if (!kid) throw new Error("No synthetic test child found (create one with a test+…@example.test parent).");

  const { storyDraft } = await import("../platform/db/schema");
  if (process.env.VOICE_CHECK_PURPOSE === "story") await db.delete(storyDraft).where(eq(storyDraft.childId, kid.id));
  const conversationId = `conv_selftest_${crypto.randomUUID().slice(0, 8)}`;
  const [row] = await db
    .insert(voiceSession)
    .values({ childId: kid.id, householdId: kid.householdId, conversationId, ageBand: kid.ageBand, locale: "en", allowedSeconds: 180, adultTest: true, purpose: process.env.VOICE_CHECK_PURPOSE === "story" ? "story" : "talk" })
    .returning({ id: voiceSession.id });

  try {
    const messages: { role: string; content: string }[] = [{ role: "assistant", content: "Hi, I'm Feelio! I'm an AI friend, not a person. How are you feeling today?" }];
    for (const text of TURNS) {
      messages.push({ role: "user", content: text });
      const t = performance.now();
      const res = await fetch(`${base}/api/voice/llm`, {
        method: "POST",
        headers: { authorization: `Bearer ${process.env.VOICE_PROXY_SECRET}`, "content-type": "application/json", },
        body: JSON.stringify({ model: "feelio-safety", stream: true, messages: [{ role: "system", content: "ignored" }, ...messages], elevenlabs_extra_body: { feelio_session: row.id }, tools: OFFERED.map((name) => ({ type: "function", function: { name } })) }),
      });
      const body = await res.text();
      const ms = Math.round(performance.now() - t);
      let said = "";
      const tools: string[] = [];
      let timing = "";
      for (const line of body.split("\n")) {
        if (line.startsWith(": feelio")) timing = line.slice(9);
        if (!line.startsWith("data: {")) continue;
        const d = JSON.parse(line.slice(6)).choices[0].delta;
        if (d.content) said += d.content;
        for (const c of d.tool_calls ?? []) tools.push(`${c.function.name}(${c.function.arguments})`);
      }
      console.log(`\nchild: ${text}\nfeelio: ${said.trim()}\ntools: ${tools.join(", ") || "-"}\n${timing} (round trip ${ms} ms)`);
      messages.push({ role: "assistant", content: said.trim() });
    }
  } finally {
    await db.delete(voiceSession).where(eq(voiceSession.id, row.id));
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
