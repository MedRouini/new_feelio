import { NextResponse, type NextRequest } from "next/server";
import { classifyRequest } from "@/platform/hosts";

// Routes each request to the child app or the parent dashboard by host (D-032).
// Routing only: authorisation is checked again inside every page, route and server action.
export function proxy(request: NextRequest) {
  const app = process.env.APP_ORIGIN;
  const dashboard = process.env.DASHBOARD_ORIGIN;
  if (!app || !dashboard) {
    return new NextResponse("Server misconfigured: APP_ORIGIN / DASHBOARD_ORIGIN missing", { status: 500 });
  }

  // Prefer x-forwarded-host: Next's in-process render of a server-action redirect arrives with the
  // server's own Host but keeps the original x-forwarded-host. On Vercel the edge sets this header and
  // clients can't override it. Routing only: parent session cookies are host-only, so a spoofed
  // header cannot carry a parent session onto the child host (D-032).
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const decision = classifyRequest(host, request.nextUrl.pathname, { app, dashboard });

  if (decision.action === "notFound") {
    return new NextResponse("Not found", { status: 404 });
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-feelio-surface", decision.surface);

  if (decision.action === "rewrite") {
    const url = request.nextUrl.clone();
    url.pathname = decision.pathname;
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  }
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  // Skip static files and image optimisation; everything else is routed by host.
  // Static files, the PWA manifest and the service worker are served as they are on both hosts.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|generated/|fonts/|sounds/|audio/|brand/|manifest.webmanifest|sw.js).*)"],
};
