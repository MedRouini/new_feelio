// Host routing (D-032): the child app and the parent dashboard are separate hosts served by one
// Next.js deployment. Pure function so it can be unit-tested; proxy.ts applies the result.
// This is routing only. Every page, route handler and server action still checks its own
// authorisation (auth/guards.ts), per the Next.js data-security guidance.

export type Surface = "child" | "dashboard";

export type HostDecision =
  | { action: "next"; surface: Surface }
  | { action: "rewrite"; surface: Surface; pathname: string }
  | { action: "notFound" };

// Each surface lives under its own internal prefix (app/parent, app/child), so a page can never be
// rendered on the other surface's host. This matters for server-action redirects too: Next resolves
// them in-process without passing through the proxy, and an unprefixed path matches no page, so it
// becomes a real navigation that goes through this routing again (D-032).
const PARENT_PREFIX = "/parent";
const CHILD_PREFIX = "/child";

function underPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function withPrefix(prefix: string, pathname: string) {
  return pathname === "/" ? prefix : `${prefix}${pathname}`;
}

function hostOf(origin: string): string {
  return new URL(origin).host.toLowerCase();
}

export function classifyRequest(
  host: string | null,
  pathname: string,
  origins: { app: string; dashboard: string },
): HostDecision {
  const h = (host ?? "").toLowerCase();
  const isDashboard = h === hostOf(origins.dashboard);

  // Scheduled jobs carry their own secret and may arrive on any host.
  if (pathname.startsWith("/api/cron/")) {
    return { action: "next", surface: isDashboard ? "dashboard" : "child" };
  }

  // Internal prefixes are never addressable directly, on either host.
  if (underPrefix(pathname, PARENT_PREFIX) || underPrefix(pathname, CHILD_PREFIX)) {
    return { action: "notFound" };
  }

  if (isDashboard) {
    if (pathname.startsWith("/api/auth/") || pathname.startsWith("/api/parent/")) {
      return { action: "next", surface: "dashboard" };
    }
    if (pathname.startsWith("/api/")) return { action: "notFound" };
    return { action: "rewrite", surface: "dashboard", pathname: withPrefix(PARENT_PREFIX, pathname) };
  }

  // Child host (and any other host, e.g. preview URLs): parent surfaces are never reachable here.
  if (pathname.startsWith("/api/child/")) return { action: "next", surface: "child" };
  if (pathname.startsWith("/api/")) return { action: "notFound" };
  return { action: "rewrite", surface: "child", pathname: withPrefix(CHILD_PREFIX, pathname) };
}
