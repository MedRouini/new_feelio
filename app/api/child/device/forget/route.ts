import { NextResponse, type NextRequest } from "next/server";
import { CHILD_DEVICE_COOKIE } from "@/auth/constants";
import { env } from "@/platform/env";

// Removes the device key cookie from this browser. Revoking the key itself is a parent action.
export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== env().APP_ORIGIN) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const res = NextResponse.redirect(new URL("/", env().APP_ORIGIN), 303);
  res.cookies.delete(CHILD_DEVICE_COOKIE);
  return res;
}
