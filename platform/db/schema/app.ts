import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { session, user } from "./auth";

// Data minimisation (CR-6): store only what a feature needs. Every table has a
// retention period and a deletion path; see docs/ARCHITECTURE.md §7 and platform/retention.ts.

const id = () => text("id").primaryKey().$defaultFn(() => crypto.randomUUID());
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const ageBand = pgEnum("age_band", ["5-6", "7-9", "10-12"]);
export const locale = pgEnum("locale", ["en", "ar"]);

// One household per parent account (the account owner). Deleted with the account.
export const household = pgTable("household", {
  id: id(),
  ownerUserId: text("owner_user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  market: text("market").notNull(),
  timezone: text("timezone").notNull().default("UTC"),
  locale: locale("locale").notNull().default("en"),
  createdAt: createdAt(),
});

// Verifiable parental consent, recorded before any child data exists (SPEC §1, §7).
// Kept for the account's lifetime plus any legal hold counsel sets (docs/LEGAL_NOTES.md).
export const consentRecord = pgTable(
  "consent_record",
  {
    id: id(),
    householdId: text("household_id")
      .notNull()
      .references(() => household.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    policyVersion: text("policy_version").notNull(),
    market: text("market").notNull(),
    method: text("method").notNull(), // from the market config, e.g. "account_reauth_checkbox"
    scopes: jsonb("scopes").$type<string[]>().notNull(),
    acceptedAt: createdAt(),
    withdrawnAt: timestamp("withdrawn_at", { withTimezone: true }),
  },
  (t) => [index("consent_household_idx").on(t.householdId)],
);

// A child has no credentials and no email. The nickname is optional, encrypted at rest
// (platform/crypto.ts) and never sent to any provider.
export const childProfile = pgTable(
  "child_profile",
  {
    id: id(),
    householdId: text("household_id")
      .notNull()
      .references(() => household.id, { onDelete: "cascade" }),
    nicknameEnc: text("nickname_enc"),
    ageBand: ageBand("age_band").notNull(),
    locale: locale("locale").notNull(),
    // Onboarding (docs/ONBOARDING.md §6). All child-scope, fixed vocabularies, deleted with the profile.
    avatar: jsonb("avatar").$type<AvatarChoice>(),
    /** Key into content/nicknames.<locale>.json; null when the parent's nickname is used. */
    nicknameKey: text("nickname_key"),
    interests: text("interests").array().notNull().default([]),
    onboarding: jsonb("onboarding").$type<OnboardingState>().notNull().default({ step: 0 }),
    createdAt: createdAt(),
  },
  (t) => [index("child_household_idx").on(t.householdId)],
);

export type AvatarChoice = { v: 1; shape: "bun" | "bean" | "puff"; colour: "amber" | "rose" | "lilac" | "sky"; companion: "heart" | "cloud" | "star" };
export type OnboardingState = { step: number; completedAt?: string; skipped?: boolean };

export type ScheduleWindow = { days: number[]; start: string; end: string };
export type FeatureFlags = { talk: boolean; stories: boolean; scenarios: boolean };

// Every setting here is enforced on the server (CR-2), never only hidden in the UI.
export const childSettings = pgTable("child_settings", {
  childId: text("child_id")
    .primaryKey()
    .references(() => childProfile.id, { onDelete: "cascade" }),
  features: jsonb("features")
    .$type<FeatureFlags>()
    .notNull()
    .default({ talk: false, stories: true, scenarios: true }),
  dailyMinutes: integer("daily_minutes").notNull().default(30),
  voiceDailyMinutes: integer("voice_daily_minutes").notNull().default(8),
  schedule: jsonb("schedule")
    .$type<ScheduleWindow[]>()
    .notNull()
    .default([{ days: [0, 1, 2, 3, 4, 5, 6], start: "07:00", end: "20:00" }]),
  textScale: integer("text_scale").notNull().default(100),
  sound: boolean("sound").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// World progress per child (SPEC §4.1), one row per level activity (artifact). Checked by the
// server's unlock engine. Retention: with the profile (PRIVACY.md).
export const progress = pgTable(
  "progress",
  {
    id: id(),
    childId: text("child_id")
      .notNull()
      .references(() => childProfile.id, { onDelete: "cascade" }),
    packId: text("pack_id").notNull(),
    levelId: text("level_id").notNull(),
    scenarioId: text("scenario_id").notNull().default(""),
    /** "started": the child opened this activity; "completed": finished it (D-056). */
    status: text("status", { enum: ["started", "completed"] }).notNull().default("completed"),
    /** When the row reached its current status. */
    completedAt: createdAt(),
  },
  (t) => [uniqueIndex("progress_unique").on(t.childId, t.packId, t.levelId, t.scenarioId)],
);

export const collectionItem = pgTable(
  "collection_item",
  {
    childId: text("child_id")
      .notNull()
      .references(() => childProfile.id, { onDelete: "cascade" }),
    itemId: text("item_id").notNull(),
    earnedAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.childId, t.itemId] })],
);

// Caps and the budget meter (CR-11). Retention: 90 days, then deleted.
export const usageLedger = pgTable(
  "usage_ledger",
  {
    id: id(),
    childId: text("child_id")
      .notNull()
      .references(() => childProfile.id, { onDelete: "cascade" }),
    householdId: text("household_id").notNull(),
    day: date("day").notNull(),
    feature: text("feature").notNull(),
    seconds: integer("seconds").notNull().default(0),
    tokens: integer("tokens").notNull().default(0),
    creditsEst: integer("credits_est").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [index("usage_child_day_idx").on(t.childId, t.day)],
);

// Adult gate: when this login session last re-checked the parent's password.
// Server-side only; deleted with the session, and swept daily after 1 day.
export const adultGate = pgTable("adult_gate", {
  sessionId: text("session_id")
    .primaryKey()
    .references(() => session.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  passedAt: timestamp("passed_at", { withTimezone: true }).notNull().defaultNow(),
});

// Parent setting changes (who, what, when). Retention: 1 year.
export const auditLog = pgTable(
  "audit_log",
  {
    id: id(),
    householdId: text("household_id")
      .notNull()
      .references(() => household.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    action: text("action").notNull(),
    detail: jsonb("detail").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: createdAt(),
  },
  (t) => [index("audit_household_idx").on(t.householdId)],
);

// Global switches and budgets (kill switches, provider-approval flags; ARCHITECTURE §9).
export const config = pgTable("config", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
