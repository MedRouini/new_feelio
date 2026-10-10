import { NextResponse, type NextRequest } from "next/server";
import { getChild } from "@/auth/guards";
import { onboardingUpdateSchema } from "@/child/options";
import { applyOnboardingUpdate } from "@/child/view";
import { env } from "@/platform/env";

// Child scope. Saves onboarding choices from fixed lists only (ONBOARDING.md §4): nothing free-form,
// nothing the child typed or said, so nothing here needs a model or bypasses the safety layer.
export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== env().APP_ORIGIN) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const child = await getChild();
  if (!child) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const parsed = onboardingUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });

  try {
    await applyOnboardingUpdate(child, parsed.data);
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
