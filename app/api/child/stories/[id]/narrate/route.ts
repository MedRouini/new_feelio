import { NextResponse, type NextRequest } from "next/server";
import { getChild } from "@/auth/guards";
import { narrationFile } from "@/child/stories";

// Child scope: "Read it to me" for one page of the child's own story (D-070). The audio is made once
// (capped per day), kept privately with the story, and streamed only to its owner.
export const maxDuration = 30;

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const child = await getChild();
  if (!child) return new NextResponse("Not found", { status: 404 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new NextResponse("Not found", { status: 404 });
  const r = await narrationFile(child, id, Number(request.nextUrl.searchParams.get("page")));
  if (!r.ok) return NextResponse.json({ error: r.reason }, { status: r.reason === "not_found" ? 404 : r.reason === "cap" ? 429 : 503 });
  return new NextResponse(r.file.stream, { headers: { "content-type": r.file.contentType, "cache-control": "private, max-age=86400", "x-content-type-options": "nosniff" } });
}
