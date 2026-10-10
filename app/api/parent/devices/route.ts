import { NextResponse, type NextRequest } from "next/server";
import { checkParent } from "@/auth/guards";
import { auth } from "@/auth/server";
import { createDeviceKey } from "@/parent/operations";
import { env } from "@/platform/env";

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

// Issues a child device key (parent scope, adult gate) and hands it to the child host with an
// auto-submitting form POST, so the key never appears in a URL, a log or browser history (D-033).
export async function POST(request: NextRequest) {
  const { APP_ORIGIN, DASHBOARD_ORIGIN } = env();
  if (request.headers.get("origin") !== DASHBOARD_ORIGIN) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const form = await request.formData();
  const childId = String(form.get("childId") ?? "");
  const check = await checkParent({ gate: "area", needHousehold: true });
  if (!check.ok) {
    const next = `/children/${encodeURIComponent(childId)}`;
    const to = check.reason === "signed_out" ? `/sign-in?next=${next}` : check.reason === "gate_required" ? `/gate?next=${next}` : "/consent";
    return NextResponse.redirect(new URL(to, DASHBOARD_ORIGIN), 303);
  }
  let key: string;
  try {
    ({ key } = await createDeviceKey({
      userId: check.parent.userId,
      householdId: check.parent.householdId!,
      childId,
      label: String(form.get("label") ?? "Device"),
    }));
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const action = escapeHtml(`${APP_ORIGIN}/api/child/device/claim`);
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="strict-origin-when-cross-origin"><title>Feelio</title></head>
<body style="font-family:system-ui;padding:24px">
<form id="claim" method="post" action="${action}"><input type="hidden" name="key" value="${escapeHtml(key)}"><button type="submit">Continue</button></form>
<script>document.getElementById("claim").submit()</script>
</body></html>`;
  const res = new NextResponse(html, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" },
  });
  // This browser is now the child's device: sign the parent out here so the child can't reach the
  // parent area with the leftover session (the adult gate would otherwise stay open for minutes).
  const out = await auth.api.signOut({ headers: request.headers, returnHeaders: true });
  for (const c of out.headers.getSetCookie()) res.headers.append("set-cookie", c);
  return res;
}
