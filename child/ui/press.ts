// Shared press states for the child app's buttons (D-075): one mapping to attributes, so every
// pressable, action object and choice looks and announces the same state the same way.
export type PressState = { loading?: boolean; disabled?: boolean; selected?: boolean; resting?: boolean };

export function pressAttrs(s: PressState) {
  return {
    "aria-busy": s.loading || undefined,
    "aria-disabled": s.disabled || undefined,
    "data-loading": s.loading || undefined,
    "data-disabled": s.disabled || undefined,
    "data-selected": s.selected || undefined,
    "data-resting": s.resting || undefined,
  };
}

/** Loading or disabled controls ignore presses; a resting one still answers (Feelio says why). */
export function canPress(s: PressState): boolean {
  return !s.loading && !s.disabled;
}
