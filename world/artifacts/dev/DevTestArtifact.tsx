"use client";

import type { ArtifactProps } from "../types";
import styles from "./dev.module.css";

// DEVELOPMENT ONLY. Not a real activity and never shown in production (see catalog.ts). It exists so
// the level flow can be tested end to end before real artifacts are built. Deliberately styled as a
// developer tool (dashed outline, system font, plain English) so nobody mistakes it for the product.
export default function DevTestArtifact({ levelId, onComplete, onExit }: ArtifactProps) {
  return (
    <div className={styles.dev} data-testid="dev-test-artifact" dir="ltr">
      <p className={styles.title}>Developer test: not a real activity</p>
      <p>
        Level <code>{levelId}</code> has no artifact yet. Use these buttons to test saving, unlocking and the celebration
        screen. This box exists only in development builds.
      </p>
      <div className={styles.row}>
        <button type="button" onClick={onComplete} data-testid="dev-complete">
          Mark as finished (test)
        </button>
        <button type="button" onClick={onExit} data-testid="dev-exit">
          Leave (test)
        </button>
      </div>
    </div>
  );
}
