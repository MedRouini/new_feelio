import type { ComponentType } from "react";
import { DEV_TEST_ARTIFACT } from "./catalog";
import type { ArtifactProps } from "./types";

// Code for each registered artifact, loaded on demand so a level only downloads what it plays.
// Every id here must also be in ARTIFACT_CATALOG (unit-tested).
type Loader = () => Promise<{ default: ComponentType<ArtifactProps> }>;

export const ARTIFACT_LOADERS: Record<string, Loader> = {
  "home-3-tower": () => import("./scenarios/TowerArtifact"),
};

// Development builds only: this branch is removed from production bundles.
if (process.env.NODE_ENV === "development") {
  ARTIFACT_LOADERS[DEV_TEST_ARTIFACT] = () => import("./dev/DevTestArtifact");
}

export function loadArtifact(id: string) {
  const load = ARTIFACT_LOADERS[id];
  if (!load) return Promise.reject(new Error(`No loader for artifact "${id}"`));
  return load();
}
