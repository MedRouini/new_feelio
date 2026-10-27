import type { WorldLevel } from "@/world/schema";

// The activity ("artifact") catalog (D-056). An artifact is one playable thing inside a level: an
// authored, reviewed scenario or game (Milestone 4). Levels list their artifacts in world.json
// (`scenarioIds`); only ids registered here can be played or completed, so content that isn't
// built and reviewed can never be shown. A `draft` artifact is not reviewed yet: it plays only in
// development and test runs, so the owner can see it, and production treats its level as not made yet.
// Plain data, safe on the server and the client. The React side lives in ./loaders.ts.

export type ArtifactKind = "scenario" | "game";

/** Registered artifacts: id → kind. Add an entry here (and a loader) when an artifact is built. */
export const ARTIFACT_CATALOG: Record<string, { kind: ArtifactKind; draft?: true }> = {
  // The Tower, Home level 3 (D-078, docs/SEL_ADVENTURES.md). Draft until the owner reviews it.
  "home-3-tower": { kind: "scenario", draft: true },
};

/**
 * Developer-only stand-in, so the level flow (start, complete, unlock, celebrate) can be exercised
 * before real artifacts exist. It is clearly labelled as a test, is offered only for levels without
 * real artifacts, and exists only in development and test runs: production never registers or accepts it.
 */
export const DEV_TEST_ARTIFACT = "dev-test";
export const devArtifactsEnabled = () => process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";

/** The artifacts a child plays for this level, in order (empty: the level isn't made yet). */
export function artifactsForLevel(level: Pick<WorldLevel, "scenarioIds">): string[] {
  const real = level.scenarioIds.filter((id) => id in ARTIFACT_CATALOG && (!ARTIFACT_CATALOG[id].draft || devArtifactsEnabled()));
  if (real.length) return real;
  return devArtifactsEnabled() ? [DEV_TEST_ARTIFACT] : [];
}
