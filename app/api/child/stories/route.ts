import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getChild } from "@/auth/guards";
import { createStory, setDraftListChoice, storyGate, type StoryRefusal } from "@/child/stories";
import { env } from "@/platform/env";
import { SLOTS } from "@/safety/stories/choices";

// Child scope: the story workshop (D-070). The client sends ids only: a slot and a list choice it
// tapped, or "make it". The story is made from the slots saved on the server, never from client text.
const body = z.discriminatedUnion("action", [
  z.strictObject({ action: z.literal("slot"), slot: z.enum(SLOTS), id: z.string().regex(/^[a-z_]{2,24}$/) }),
  z.strictObject({ action: z.literal("create") }),
]);

const STATUS: Record<StoryRefusal, number> = { off: 503, stories_off: 403, time_up: 403, outside_hours: 403, daily_cap: 429, incomplete: 409, unavailable: 503 };

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== env().APP_ORIGIN) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const child = await getChild();
  if (!child) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const parsed = body.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const b = parsed.data;

  if (b.action === "slot") {
    const refusal = await storyGate(child.childId);
    if (refusal) return NextResponse.json({ error: refusal }, { status: STATUS[refusal] });
    const draft = await setDraftListChoice(child.childId, b.slot, b.id);
    if (!draft) return NextResponse.json({ error: "invalid" }, { status: 400 });
    return NextResponse.json({ draft });
  }
  const r = await createStory(child);
  if (!r.ok) return NextResponse.json({ error: r.reason }, { status: STATUS[r.reason] });
  return NextResponse.json({ id: r.id });
}
