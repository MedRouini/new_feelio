"use client";

import { useTranslations } from "next-intl";
import { Pressable } from "@/child/ui/Pressable";
import { AssetImage } from "@/design/components/AssetImage";
import { pickOptional } from "@/design/asset-slots";
import type { AssetId } from "@/design/asset-ids";
import { SLOTS, type Slot } from "@/safety/stories/choices";
import { choiceArt } from "../art";
import styles from "./workshop.module.css";

type Item = { id: string; en: string; ar: string };
export const STEP_ICON: Record<Slot, AssetId> = { hero: "ui_step_hero", place: "ui_step_place", feeling: "face_happy", adventure: "ui_step_adventure" };

/**
 * Where the child is in making a story (D-075): four tickets, one per step. A done ticket shows the
 * chosen picture; the current one is lit; any ticket opens its step again.
 */
export function StepTickets({ filled, active, locale, compact, onOpen }: { filled: Partial<Record<Slot, Item>>; active: Slot | null; locale: "en" | "ar"; compact: boolean; onOpen: (s: Slot) => void }) {
  const t = useTranslations("child.stories");
  return (
    <nav className={styles.tickets} aria-label={t("steps.label")}>
      {SLOTS.map((s) => {
        const c = filled[s];
        const art = c ? (pickOptional(choiceArt(s, c.id)) ?? STEP_ICON[s]) : STEP_ICON[s];
        const word = c ? (locale === "ar" ? c.ar : c.en) : t(`slots.${s}`);
        const name = c ? t("steps.done", { slot: t(`slots.${s}`), choice: word }) : active === s ? t("steps.now", { slot: t(`slots.${s}`) }) : t("steps.next", { slot: t(`slots.${s}`) });
        return (
          <Pressable
            key={s}
            tone="night"
            label={name}
            showLabel={false}
            selected={c ? true : undefined}
            current={active === s ? "step" : undefined}
            onPress={() => onOpen(s)}
            className={styles.ticket}
            testId={`slot-${s}`}
          >
            <AssetImage id={art} alt="" sizes="48px" className={styles.ticketArt} />
            {compact ? null : <span className={styles.ticketWord}>{word}</span>}
          </Pressable>
        );
      })}
    </nav>
  );
}
