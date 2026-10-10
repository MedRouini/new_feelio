"use client";

// Short UI sounds (Kenney Interface Sounds, CC0; D-041). Always paired with motion, never sound alone.
// The parent can turn sound off (child_settings.sound); the shell passes that in via setSoundEnabled.

export type SoundRole = "tap" | "pick" | "unlock" | "step" | "whoosh" | "pop";

let enabled = true;
const cache = new Map<SoundRole, HTMLAudioElement>();

export function setSoundEnabled(on: boolean) {
  enabled = on;
}

export function play(role: SoundRole) {
  if (!enabled || typeof window === "undefined") return;
  let a = cache.get(role);
  if (!a) {
    a = new Audio(`/sounds/${role}.wav`);
    a.preload = "auto";
    cache.set(role, a);
  }
  try {
    a.currentTime = 0;
    void a.play().catch(() => undefined); // autoplay rules: silently skip until the first tap
  } catch {
    // ignore: sound is a bonus, never required
  }
}
