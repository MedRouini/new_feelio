// Replays a whole talk with a game in the middle through the voice safety proxy (D-077), the way
// ElevenLabs and the Talk screen would: child turns go to /api/voice/llm, and the game's state is
// reported between turns (as the screen does). Prints what Feelio says and which tools it calls, so
// you can judge whether the talk and the game feel like one conversation. Synthetic test child only
// (a test+…@example.test parent); the session row is deleted afterwards. A few cents of Together
// credits; no ElevenLabs credits.
//   npx tsx --conditions=react-server scripts/voice-game-replay.ts [baseUrl]
// With "inline" instead of a URL, it calls the proxy route in this process (no server needed).
import { readFileSync } from "node:fs";

for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
  const i = line.indexOf("=");
  if (i > 0 && !(line.slice(0, i) in process.env)) process.env[line.slice(0, i)] = line.slice(i + 1);
}

type Game = { activity: "breathing" | "grounding" | "stretching"; step: number; status: "running" | "paused" | "done" | "stopped"; found: number };
/** A child turn, or a game report from the screen. */
type Beat = { say: string; expect?: string } | { game: Game };

const SCRIPTS: Record<string, Beat[]> = {
  noticing: [
    { say: "I'm kind of worried about my exam tomorrow.", expect: "comfort + offer the noticing game" },
    { say: "yes", expect: "starts it (offer_activity grounding)" },
    { game: { activity: "grounding", step: 0, status: "running", found: 0 } },
    { say: "...", expect: "nothing (silence during the game)" },
    { game: { activity: "grounding", step: 1, status: "running", found: 0 } },
    { say: "Look around you. Find three things you can see, and tap a star for each one.", expect: "nothing (echo of the recorded line)" },
    { say: "hmm", expect: "nothing (a small sound)" },
    { say: "what do I have to do?", expect: "explains the step: find three things you can see" },
    { game: { activity: "grounding", step: 1, status: "running", found: 2 } },
    { say: "I can see my lamp and a book!", expect: "cheers, connected to the finding, back to the game" },
    { say: "actually I don't want to play anymore, it's boring", expect: "fine + stop_activity" },
    { game: { activity: "grounding", step: 1, status: "stopped", found: 2 } },
    { say: "...", expect: "no guilt; keeps talking" },
    { say: "can we talk about the exam again?", expect: "remembers the exam" },
  ],
  breathing: [
    { say: "I feel really overwhelmed, there's too much going on", expect: "comfort + offer breathing" },
    { say: "okay sure", expect: "offer_activity breathing" },
    { game: { activity: "breathing", step: 2, status: "running", found: 0 } },
    { say: "Feelio, are you breathing too?", expect: "short, about the breathing, back to it" },
    { game: { activity: "breathing", step: 7, status: "done", found: 0 } },
    { say: "yes", expect: "answers 'Do you want to talk some more?' + asks how they feel" },
    { say: "a little better. what were we talking about before?", expect: "remembers: too much going on" },
  ],
};
const OFFERED = ["end_call", "skip_turn", "set_mascot_state", "show_feeling_card", "offer_activity", "stop_activity", "suggest_place", "show_safety_resources", "show_story_choice"];

async function main() {
  const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
  const pick = process.env.REPLAY ? [process.env.REPLAY] : Object.keys(SCRIPTS);
  const { db } = await import("../platform/db/client");
  const { childProfile, household, voiceSession, user } = await import("../platform/db/schema");
  const { and, eq, like } = await import("drizzle-orm");
  const { EMPTY_GAME, remember } = await import("../child/gameMemory");
  const call: (url: string, init: RequestInit) => Promise<Response> =
    base === "inline"
      ? async (url, init) => {
          const { NextRequest } = await import("next/server");
          const { POST } = await import("../app/api/voice/llm/route");
          return POST(new NextRequest(url.replace(/^inline/, "http://localhost"), init as ConstructorParameters<typeof NextRequest>[1]));
        }
      : fetch;

  const [kid] = await db
    .select({ id: childProfile.id, householdId: childProfile.householdId, ageBand: childProfile.ageBand })
    .from(childProfile)
    .innerJoin(household, eq(household.id, childProfile.householdId))
    .innerJoin(user, eq(user.id, household.ownerUserId))
    .where(and(like(user.email, "test+%@example.test"), eq(childProfile.locale, "en")))
    .limit(1);
  if (!kid) throw new Error("No synthetic test child found (create one with a test+…@example.test parent).");

  for (const name of pick) {
    console.log(`\n=== ${name}`);
    const [row] = await db
      .insert(voiceSession)
      .values({ childId: kid.id, householdId: kid.householdId, conversationId: `conv_replay_${crypto.randomUUID().slice(0, 8)}`, ageBand: kid.ageBand, locale: "en", allowedSeconds: 240, adultTest: true, purpose: "talk" })
      .returning({ id: voiceSession.id });
    let memory = EMPTY_GAME;
    try {
      const messages: { role: string; content: string }[] = [{ role: "assistant", content: "Hi, I'm Feelio! I'm an AI friend, not a person. How are you feeling today?" }];
      for (const beat of SCRIPTS[name]) {
        if ("game" in beat) {
          // what the screen reports through /api/child/voice/session (same rule: child/gameMemory.remember)
          memory = remember(memory, beat.game);
          await db.update(voiceSession).set({ game: memory }).where(eq(voiceSession.id, row.id));
          console.log(`   [game] ${beat.game.activity} step ${beat.game.step} ${beat.game.status}${beat.game.found ? ` found ${beat.game.found}` : ""}`);
          continue;
        }
        messages.push({ role: "user", content: beat.say });
        const t = performance.now();
        const res = await call(`${base}/api/voice/llm`, {
          method: "POST",
          headers: { authorization: `Bearer ${process.env.VOICE_PROXY_SECRET}`, "content-type": "application/json" },
          body: JSON.stringify({ model: "feelio-safety", stream: true, messages: [{ role: "system", content: "ignored" }, ...messages], elevenlabs_extra_body: { feelio_session: row.id }, tools: OFFERED.map((n) => ({ type: "function", function: { name: n } })) }),
        });
        let said = "";
        const tools: string[] = [];
        for (const line of (await res.text()).split("\n")) {
          if (!line.startsWith("data: {")) continue;
          const d = JSON.parse(line.slice(6)).choices[0].delta;
          if (d.content) said += d.content;
          for (const c of d.tool_calls ?? []) tools.push(`${c.function.name}(${c.function.arguments})`);
        }
        said = said.trim();
        // ElevenLabs keeps what Feelio said (and nothing when Feelio stays quiet)
        if (said) messages.push({ role: "assistant", content: said });
        console.log(`child: ${beat.say}\n  feelio (${Math.round(performance.now() - t)} ms): ${said || "(no reply)"} ${tools.join(" ")}\n  expected: ${beat.expect}`);
      }
    } finally {
      await db.delete(voiceSession).where(eq(voiceSession.id, row.id));
    }
  }
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  },
);
