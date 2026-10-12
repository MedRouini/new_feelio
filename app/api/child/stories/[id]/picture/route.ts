import { NextResponse, type NextRequest } from "next/server";
import { getChild } from "@/auth/guards";
import { drawPicture, pictureFile } from "@/child/stories";
import { env } from "@/platform/env";

// Child scope: one picture of the child's own story (D-070). POST draws it (one short request each,
// so pages appear as they finish and every request stays within the function time limit); GET streams
// it from private storage, only to the child who owns the story.

export const maxDuration = 60;

const ID = /^[0-9a-f-]{36}$/;

function n(request: NextRequest): number {
  return Number(request.nextUrl.searchParams.get("n"));
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (request.headers.get("origin") !== env().APP_ORIGIN) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const child = await getChild();
  if (!child) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!ID.test(id)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const r = await drawPicture(child.childId, id, n(request));
  if (!r.ok) return NextResponse.json({ error: r.reason }, { status: r.reason === "not_found" ? 404 : r.reason === "unavailable" ? 503 : 409 });
  return NextResponse.json({ state: r.state });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const child = await getChild();
  if (!child) return new NextResponse("Not found", { status: 404 });
  const { id } = await params;
  if (!ID.test(id)) return new NextResponse("Not found", { status: 404 });
  const file = await pictureFile(child.childId, id, n(request));
  if (!file) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(file.stream, {
    headers: { "content-type": file.contentType, "x-content-type-options": "nosniff", "cache-control": "private, max-age=86400" },
  });
}
