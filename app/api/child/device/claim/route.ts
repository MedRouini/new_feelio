import { NextResponse, type NextRequest } from "next/server";
import { CHILD_DEVICE_COOKIE, CHILD_DEVICE_KEY_DAYS } from "@/auth/constants";
import { verifyChildKey } from "@/auth/guards";
import { LOCALE_COOKIE } from "@/i18n/request";
import { env } from "@/platform/env";

// Receives a freshly issued child device key from the parent dashboard (form POST from the
// dashboard host) and stores it in an httpOnly cookie on the child host only (D-033).
export async function POST(request: NextRequest) {
  const { APP_ORIGIN, DASHBOARD_ORIGIN } = env();
  // Only the dashboard may hand a key to this device.
  if (request.headers.get("origin") !== DASHBOARD_ORIGIN) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const form = await request.formData();
  const key = form.get("key");
  const child = typeof key === "string" ? await verifyChildKey(key) : null;
  if (!child || typeof key !== "string") {
    return NextResponse.redirect(new URL("/?setup=failed", APP_ORIGIN), 303);
  }

  const res = NextResponse.redirect(new URL("/", APP_ORIGIN), 303);
  const secure = APP_ORIGIN.startsWith("https://");
  res.cookies.set(CHILD_DEVICE_COOKIE, key, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: CHILD_DEVICE_KEY_DAYS * 24 * 60 * 60,
  });
  res.cookies.set(LOCALE_COOKIE, child.locale, { httpOnly: false, secure, sameSite: "lax", path: "/", maxAge: 365 * 24 * 60 * 60 });
  return res;
}
