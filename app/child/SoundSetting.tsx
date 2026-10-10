"use client";

import { useEffect } from "react";
import { setSoundEnabled } from "@/child/ui/sound";

/** Applies the parent's sound setting (child_settings.sound) to the UI sounds on this page. */
export function SoundSetting({ on }: { on: boolean }) {
  useEffect(() => setSoundEnabled(on), [on]);
  return null;
}
