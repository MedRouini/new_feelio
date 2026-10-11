"use client";

import { useTranslations } from "next-intl";
import type { CompletionResult } from "@/child/progress";
import { Mascot } from "@/child/ui/Mascot";
import { ThingButton } from "@/child/ui/ThingButton";
import { CELEBRATE, LEVEL_NODE, pick, pickOptional } from "@/design/asset-slots";
import { AssetImage } from "@/design/components/AssetImage";
import styles from "./level.module.css";

type Props = {
  placeId: string;
  placeName: string;
  level: { id: string; order: number };
  levels: { id: string; order: number }[];
  locale: "en" | "ar";
  tint: string;
  placeNames: Record<string, string>;
  result: CompletionResult;
  onNext: (href: string, from: Element | null) => void;
};

/**
 * After a level (D-056): a star, the mascot cheering, the place's progress as a row of stones (the one
 * just finished pops), and what opened. One big action: keep going, which walks the characters on to
 * the next stone, or to the world map when a new place opened. Gentle: no scores, no timers.
 */
export function Celebration({ placeId, placeName, level, levels, locale, tint, placeNames, result, onNext }: Props) {
  const t = useTranslations("child.done");
  const n = (v: number) => new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en").format(v);
  const burst = pickOptional(CELEBRATE.burst);
  const nextOrder = result.nextLevelId ? levels.find((l) => l.id === result.nextLevelId)?.order : undefined;

  const lines = [t("level", { n: n(level.order) })];
  if (result.placeCompleted) lines.push(t("place", { place: placeName }));
  else if (result.nextLevelOpened && nextOrder) lines.push(t("nextOpen", { n: n(nextOrder) }));
  for (const id of result.openedPlaceIds) lines.push(t("placeOpen", { place: placeNames[id] ?? id }));

  const toWorld = result.placeCompleted || result.openedPlaceIds.length > 0;
  const href = toWorld ? "/" : `/place/${placeId}?from=${encodeURIComponent(level.id)}`;

  return (
    <div className={styles.screen} style={{ background: tint }} data-testid="celebration" data-level={level.id}>
      <div className={styles.celebrate}>
        <div className={styles.hero}>
          <div className={styles.starWrap}>
            {burst ? <AssetImage id={burst} alt="" sizes="50vmin" className={styles.burst} style={{ maxWidth: "none" }} /> : null}
            <AssetImage id={pick(CELEBRATE.star)} alt="" sizes="30vmin" className={styles.star} />
          </div>
          <Mascot pose={pick(CELEBRATE.mascot)} label={lines[0]} sizes="26vmin" className={styles.cheerMascot} />
        </div>
        <div className={styles.side}>
          <div className={styles.lines} role="status" aria-live="polite">
            {lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <ol
            className={styles.progressRow}
            aria-label={t("progress", {
              done: n(result.place.completedCount),
              total: n(result.place.total),
            })}
            data-testid="progress-row"
          >
            {levels.map((l) => {
              const st = result.place.levels[l.id];
              return (
                <li key={l.id} className={l.id === level.id ? styles.justDone : undefined} data-state={st}>
                  <AssetImage id={pick(LEVEL_NODE[st])} alt="" sizes="72px" />
                  <span aria-hidden>{n(l.order)}</span>
                </li>
              );
            })}
          </ol>
          <ThingButton
            art={toWorld ? "dock_map" : pick(LEVEL_NODE.available)}
            label={t("next")}
            showLabel
            sound="pick"
            sizes="120px"
            className={styles.nextThing}
            onPress={() => onNext(href, document.querySelector('[data-testid="celebration-next"]'))}
            testId="celebration-next"
          />
        </div>
      </div>
    </div>
  );
}
