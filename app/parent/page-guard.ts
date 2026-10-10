import "server-only";
import { redirect as nextRedirect } from "next/navigation";
import { checkParent, type GateLevel, type ParentContext } from "@/auth/guards";
import { env } from "@/platform/env";

/**
 * Redirect within the dashboard using an absolute URL. Next renders a relative redirect target
 * in-process with the server's own host, which would bypass host routing (D-032); an absolute URL
 * is a real navigation that goes through proxy.ts.
 */
export function dashboardRedirect(path: string): never {
  return nextRedirect(`${env().DASHBOARD_ORIGIN}${path}`);
}

/** For parent pages: redirects to sign-in, the adult gate or consent as needed. */
export async function requireParentPage(next: string, opts: { gate?: GateLevel; needHousehold?: boolean } = { gate: "area" }): Promise<ParentContext> {
  const check = await checkParent(opts);
  if (check.ok) return check.parent;
  if (check.reason === "signed_out") dashboardRedirect(`/sign-in?next=${encodeURIComponent(next)}`);
  if (check.reason === "gate_required") dashboardRedirect(`/gate?level=${opts.gate ?? "area"}&next=${encodeURIComponent(next)}`);
  dashboardRedirect("/consent");
}
