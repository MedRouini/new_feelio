// Shared vocabulary of the safety layer (docs/SAFETY_POLICY.md §2). Everything that reaches or
// leaves a model passes through safety/ (CLAUDE.md rule 1); these types are its public language.

export const CATEGORIES = [
  "ok",
  "sad_or_worried",
  "anger",
  "sexual",
  "sexual_minor",
  "grooming",
  "sextortion",
  "self_harm",
  "suicide",
  "abuse_disclosure",
  "immediate_danger",
  "violence_graphic",
  "dangerous_activity",
  "hate_or_bullying",
  "pii",
  "dependency",
  "human_claim_probe",
  "jailbreak",
  "medical_or_diagnosis",
  "off_topic_adult",
] as const;
export type Category = (typeof CATEGORIES)[number];

/** 0 none, 1 low, 2 medium, 3 high (SAFETY_POLICY §2.3). */
export type Severity = 0 | 1 | 2 | 3;

export const ACTOR_CLASSES = ["household_caregiver", "other_known_adult", "peer", "stranger_online", "stranger_offline", "unknown"] as const;
/** Who a disclosure is about (only for disclosures). Household and unknown never notify the parent (§5). */
export type ActorClass = (typeof ACTOR_CLASSES)[number];

export type AgeBand = "5-6" | "7-9" | "10-12";
export type Locale = "en" | "ar";
export type Feature = "voice" | "text" | "story" | "image_prompt" | "scenario_draft" | "test";

/**
 * Context of one safety decision. Never carries a name, school or anything identifying (§2.1).
 * Age band and locale come from our database, never from the client.
 */
export type SafetyCtx = {
  childId: string | null;
  householdId: string | null;
  ageBand: AgeBand;
  locale: Locale;
  feature: Feature;
  market: string;
  sessionId?: string;
  placeId?: string;
};

/** One thing a check noticed. */
export type Finding = {
  category: Category;
  severity: Severity;
  actorClass?: ActorClass;
  source: "t0" | "t1";
  /** The rule id (T0) or the model's label (T1), for tests and review; never the child's words. */
  rule?: string;
  confidence?: number;
};

export type ResourceKind = "trusted_adult" | "emergency_number" | "child_helpline" | "crisis_line" | "report_exploitation";
export type MascotMood = "calm" | "empathy";

/** What the router decided (a reviewed routing table, never the model). */
export type Action =
  | { type: "allow" }
  | { type: "steer"; notes: string[] }
  | { type: "redirect"; line: string }
  | { type: "crisis"; script: string; resources: ResourceKind[]; mascot: MascotMood }
  | { type: "block"; line: string };

export type EventLevel = "none" | "aggregate" | "low" | "medium" | "high";

export type Decision = {
  action: Action;
  /** The finding that decided the action (highest priority), if any. */
  primary: Finding | null;
  findings: Finding[];
  /** How the event is recorded (SAFETY_POLICY §1 G). */
  event: EventLevel;
  /** The input with personal information replaced, safe to log or store. */
  redacted: string;
};
