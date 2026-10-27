import { NextResponse, type NextRequest } from "next/server";
import { getChild } from "@/auth/guards";
import { applyRoomUpdate, roomUpdateSchema } from "@/child/room";
import { env } from "@/platform/env";

// Child scope. My room changes (D-074): worn items, colour, name and likes, from fixed lists only, and
// opening one unlocked surprise. Locked items are refused here, not just hidden in the UI (CR-2).
export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== env().APP_ORIGIN) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const child = await getChild();
  if (!child) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const parsed = roomUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const r = await applyRoomUpdate(child.childId, parsed.data);
  return r.ok ? NextResponse.json(r) : NextResponse.json({ error: "invalid" }, { status: 400 });
}
