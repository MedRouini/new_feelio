import routing from "@/content/safety/routing.json";
import type { Action, ActorClass, Category, EventLevel, Finding } from "./types";

// The policy router (SAFETY_POLICY §2.2): findings → one action, from a reviewed table. The model never
// decides an action, a crisis script, the resources shown, or the mascot's mood (D-004).

type Route = { minSeverity: number; actors?: string[]; action: Action; event: EventLevel };
const ROUTES = routing.routes as Record<string, Route[]>;
const PRIORITY = routing.priority as Category[];
const STRENGTH: Record<Action["type"], number> = { crisis: 4, block: 3, redirect: 2, steer: 1, allow: 0 };
const EVENT_RANK: EventLevel[] = ["none", "aggregate", "low", "medium", "high"];

export const ROUTING_VERSION = routing.version;

/** The route for one finding, or null when the finding needs nothing. */
export function routeOf(f: Finding): { action: Action; event: EventLevel } | null {
  const routes = ROUTES[f.category] ?? [];
  const actor: ActorClass = f.actorClass ?? "unknown";
  const hit = routes.find((r) => f.severity >= r.minSeverity && (!r.actors || r.actors.includes(actor)));
  return hit ? { action: hit.action, event: hit.event } : null;
}

export type Routed = { action: Action; primary: Finding | null; event: EventLevel; perFinding: { finding: Finding; event: EventLevel }[] };

/** Picks the strongest action across all findings; steer notes from every finding are combined. */
export function route(findings: Finding[]): Routed {
  const routed = findings.map((finding) => ({ finding, r: routeOf(finding) })).filter((x) => x.r !== null) as { finding: Finding; r: { action: Action; event: EventLevel } }[];
  const perFinding = routed.map(({ finding, r }) => ({ finding, event: r.event }));
  if (!routed.length) return { action: { type: "allow" }, primary: null, event: "none", perFinding };

  routed.sort((a, b) => STRENGTH[b.r.action.type] - STRENGTH[a.r.action.type] || PRIORITY.indexOf(a.finding.category) - PRIORITY.indexOf(b.finding.category));
  const top = routed[0];
  let action = top.r.action;
  if (action.type === "steer") {
    const notes = [...new Set(routed.flatMap((x) => (x.r.action.type === "steer" ? x.r.action.notes : [])))];
    action = { type: "steer", notes };
  }
  const event = routed.reduce<EventLevel>((max, x) => (EVENT_RANK.indexOf(x.r.event) > EVENT_RANK.indexOf(max) ? x.r.event : max), "none");
  return { action, primary: top.finding, event, perFinding };
}
