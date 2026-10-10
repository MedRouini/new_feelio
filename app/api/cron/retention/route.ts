import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/platform/env";
import { runRetention } from "@/platform/retention";

function authorised(header: string | null): boolean {
  const expected = Buffer.from(`Bearer ${env().CRON_SECRET}`);
  const got = Buffer.from(header ?? "");
  return got.length === expected.length && timingSafeEqual(got, expected);
}

// Daily retention sweep (vercel.json cron). Returns counts only, never content.
export async function GET(request: NextRequest) {
  if (!authorised(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const deleted = await runRetention();
  return NextResponse.json({ ok: true, deleted });
}
