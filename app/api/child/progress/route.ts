import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getChild } from "@/auth/guards";
import { completeArtifact, startArtifact, type ProgressRefusal } from "@/child/progress";
import { env } from "@/platform/env";

// Child scope. Records that the child opened or finished one activity of a level (D-056). Only ids
// are accepted: nothing the child typed, said or chose is sent or stored. All checks happen on the
// server (child/progress.ts): reachable level, artifact of that level, scenarios allowed, time left.
const body = z.strictObject({
  action: z.enum(["start", "complete"]),
  levelId: z.string().max(64),
  artifactId: z.string().max(64),
});

const STATUS: Record<ProgressRefusal, number> = { unknown: 404, not_in_level: 400, locked: 403, disabled: 403, time_up: 403 };

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== env().APP_ORIGIN) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
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

  const { action, levelId, artifactId } = parsed.data;
  const result = action === "start" ? await startArtifact(child, levelId, artifactId) : await completeArtifact(child, levelId, artifactId);
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: STATUS[result.reason] });
  return NextResponse.json(result);
}
