import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getChild } from "@/auth/guards";
import { db } from "@/platform/db/client";
import { childSettings } from "@/platform/db/schema";

// Child scope: what this device's child may see about itself. No nickname, no household data.
export async function GET() {
  const child = await getChild();
  if (!child) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const [s] = await db.select().from(childSettings).where(eq(childSettings.childId, child.childId)).limit(1);
  return NextResponse.json({
    ageBand: child.ageBand,
    locale: child.locale,
    features: s?.features ?? { talk: false, stories: false, scenarios: false },
    textScale: s?.textScale ?? 100,
  });
}
