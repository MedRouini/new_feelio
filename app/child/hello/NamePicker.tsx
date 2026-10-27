"use client";

import { NICKNAMES } from "@/child/options";
import styles from "./onboarding.module.css";

/** The names a child can pick: the parent's nickname first when there is one, then the reviewed list. */
export function nameChoices(locale: "en" | "ar", parentNickname: string | null): { key: string; word: string }[] {
  return [...(parentNickname ? [{ key: "parent", word: parentNickname }] : []), ...NICKNAMES.slice(0, parentNickname ? 5 : 6).map((n) => ({ key: n.key, word: n[locale] }))];
}

/** Name balloons (onboarding and My room): tap one to pick it. Nothing is ever typed. */
export function NamePicker({ names, pickedKey, onPick, label }: { names: { key: string; word: string }[]; pickedKey: string | null; onPick: (n: { key: string; word: string }) => void; label: string }) {
  return (
    <ul className={styles.balloons} aria-label={label}>
      {names.map((n, i) => (
        <li key={n.key} style={{ ["--i" as string]: i }}>
          <button type="button" className={styles.balloon} data-tone={i % 4} aria-pressed={pickedKey === n.key} onClick={() => onPick(n)} data-testid={`name-${n.key}`}>
            {n.word}
          </button>
        </li>
      ))}
    </ul>
  );
}
