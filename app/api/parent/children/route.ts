import { NextResponse } from "next/server";
import { checkParent } from "@/auth/guards";
import { listChildren } from "@/parent/operations";

// Parent scope only. A child device key is not a session, so it can never pass this check.
export async function GET() {
  const check = await checkParent({ gate: "area", needHousehold: true });
  if (!check.ok) {
    return NextResponse.json({ error: check.reason }, { status: check.reason === "signed_out" ? 401 : 403 });
  }
  const children = await listChildren(check.parent.householdId!);
  return NextResponse.json({ children: children.map(({ id, ageBand, locale }) => ({ id, ageBand, locale })) });
}
