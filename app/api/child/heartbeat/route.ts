import { NextResponse, type NextRequest } from "next/server";
import { getChild } from "@/auth/guards";
import { recordHeartbeat } from "@/child/usage";
import { env } from "@/platform/env";

// Child scope: counts screen time once a minute (server-side enforcement of the daily limit).
export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== env().APP_ORIGIN) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const child = await getChild();
  if (!child) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(await recordHeartbeat(child));
}
