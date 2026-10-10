// The contract every artifact component implements (D-056). The level player owns loading, saving
// and celebrating; an artifact only plays and reports that it is finished. Artifacts never receive
// the child's name or any personal data, and report no answers (nothing about choices is stored).
export type ArtifactProps = {
  artifactId: string;
  levelId: string;
  locale: "en" | "ar";
  ageBand: "5-6" | "7-9" | "10-12";
  /** The child finished the activity. The player saves it and moves on. */
  onComplete: () => void;
  /** The child wants to leave (always allowed, never a failure). */
  onExit: () => void;
};
