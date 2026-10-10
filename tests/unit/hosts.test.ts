import { describe, expect, it } from "vitest";
import { classifyRequest } from "@/platform/hosts";

const origins = { app: "https://app.feelio.test", dashboard: "https://dashboard.feelio.test" };
const app = "app.feelio.test";
const dash = "dashboard.feelio.test";

describe("host routing (D-032)", () => {
  it("rewrites child pages to /child internally on the app host", () => {
    expect(classifyRequest(app, "/", origins)).toEqual({ action: "rewrite", surface: "child", pathname: "/child" });
    expect(classifyRequest(app, "/talk", origins)).toEqual({ action: "rewrite", surface: "child", pathname: "/child/talk" });
    expect(classifyRequest(app, "/api/child/me", origins)).toEqual({ action: "next", surface: "child" });
  });

  it("rewrites dashboard pages to /parent internally", () => {
    expect(classifyRequest(dash, "/", origins)).toEqual({ action: "rewrite", surface: "dashboard", pathname: "/parent" });
    expect(classifyRequest(dash, "/children/abc", origins)).toEqual({ action: "rewrite", surface: "dashboard", pathname: "/parent/children/abc" });
  });

  it("never exposes parent surfaces or unknown APIs on the app host", () => {
    for (const p of ["/api/auth/sign-in/email", "/api/parent/children", "/api/parent/devices", "/api/other"]) {
      expect(classifyRequest(app, p, origins), p).toEqual({ action: "notFound" });
    }
  });

  it("never exposes child APIs on the dashboard host", () => {
    expect(classifyRequest(dash, "/api/child/me", origins)).toEqual({ action: "notFound" });
    expect(classifyRequest(dash, "/api/child/device/claim", origins)).toEqual({ action: "notFound" });
  });

  it("blocks direct internal prefixes on both hosts", () => {
    for (const h of [app, dash]) {
      for (const p of ["/child", "/child/x", "/parent", "/parent/children/1"]) {
        expect(classifyRequest(h, p, origins), `${h}${p}`).toEqual({ action: "notFound" });
      }
    }
  });

  it("allows auth and parent APIs only on the dashboard host", () => {
    expect(classifyRequest(dash, "/api/auth/get-session", origins)).toEqual({ action: "next", surface: "dashboard" });
    expect(classifyRequest(dash, "/api/parent/children", origins)).toEqual({ action: "next", surface: "dashboard" });
  });

  it("treats unknown hosts as the child surface (no parent access)", () => {
    expect(classifyRequest("preview-123.vercel.app", "/api/parent/children", origins)).toEqual({ action: "notFound" });
    expect(classifyRequest(null, "/", origins)).toEqual({ action: "rewrite", surface: "child", pathname: "/child" });
  });

  it("lets cron through on any host (the route checks its own secret)", () => {
    expect(classifyRequest(app, "/api/cron/retention", origins).action).toBe("next");
    expect(classifyRequest(dash, "/api/cron/retention", origins).action).toBe("next");
  });

  it("is case-insensitive on host", () => {
    expect(classifyRequest("DASHBOARD.feelio.test", "/", origins).action).toBe("rewrite");
  });
});
