"use client";

import { useEffect, useReducer, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, BookOpen, RotateCcw, Undo2 } from "lucide-react";
import { AssetImage } from "@/design/components/AssetImage";
import { pick, pickOptional, TOWER } from "@/design/asset-slots";
import { ActionObject } from "@/child/ui/ActionObject";
import { Caption } from "@/child/ui/Caption";
import { ChoiceDisc } from "@/child/ui/ChoiceDisc";
import { Mascot } from "@/child/ui/Mascot";
import { Pressable } from "@/child/ui/Pressable";
import { play } from "@/child/ui/sound";
import { useCalm } from "@/child/ui/useCalm";
import type { ArtifactProps } from "../types";
import { BREATH_MS, CHOICES, FACES, START, TOWER_HEIGHT, autoNext, choicesOn, lineMs, lineOf, mood, step, type Choice, type TowerEvent, type TowerState } from "./tower";
import styles from "./tower.module.css";

// The Tower, Home level 3 (D-078, docs/SEL_ADVENTURES.md). Feelio tells it in the first person; the
// child helps. Nothing the child picks is stored or sent anywhere: the journal lives only on this screen.

const HINT_MS = 8000;

function noriPose(s: TowerState): keyof typeof TOWER.nori | null {
  switch (s.beat) {
    case "build":
      return null; // Nori runs in when the tower falls
    case "shout":
      return null; // Nori ran off
    case "stomp":
      return "scared";
    case "breathe":
    case "chooseCalm":
      return "idle";
    case "tell":
      return "sorry";
    case "together":
    case "rebuild":
    case "end":
      return "happy";
    default:
      return "oops";
  }
}

export default function TowerArtifact({ locale, onComplete }: ArtifactProps) {
  const t = useTranslations("child.scenarios.tower");
  const tOnb = useTranslations("child.onb");
  const calm = useCalm();
  const [s, dispatch] = useReducer(step, START);
  const [hint, setHint] = useState(false);
  // Every move clears the hint, so it waits again from the start of the next stormy moment.
  const send = (e: TowerEvent) => {
    setHint(false);
    dispatch(e);
  };

  const line = s.beat === "choose" && hint ? "hint" : lineOf(s);
  const text = t(line);
  const auto = autoNext(s);

  // Lines that move on by themselves (the crash, Feelio's answer, an outcome, each breath).
  useEffect(() => {
    if (!auto) return;
    const ms = auto === "breath" ? BREATH_MS : lineMs(text);
    const id = setTimeout(() => dispatch({ type: auto }), ms);
    return () => clearTimeout(id);
  }, [auto, text, s.beat, s.breaths]);

  // While stormy and stuck, Feelio points to the cloud once (no pressure, no timer shown).
  useEffect(() => {
    if (s.beat !== "choose") return;
    const id = setTimeout(() => setHint(true), HINT_MS + lineMs(t("choose")));
    return () => clearTimeout(id);
  }, [s.beat, s.found, t]);

  useEffect(() => {
    if (s.beat === "crash") play("whoosh");
    if (s.beat === "end") play("unlock");
  }, [s.beat]);

  const m = mood(s);
  const pose = pick(
    s.beat === "breathe" ? (s.breaths % 2 === 0 ? TOWER.feelio.breatheIn : TOWER.feelio.breatheOut) : TOWER.feelio[m],
  );
  const nori = noriPose(s);
  const building = s.beat === "build" || s.beat === "rebuild";
  const standing = building || s.beat === "end";
  const storm = m === "angry" ? pickOptional(TOWER.storm) : null;
  const shown = choicesOn(s);

  return (
    <div className={styles.tower} data-testid="tower" data-beat={s.beat} data-mood={m} data-calm={calm || undefined}>
      <div className={styles.bg} data-orient="land" aria-hidden>
        <AssetImage id={pick(TOWER.room.land)} alt="" sizes="100vw" className={styles.bgImg} priority />
      </div>
      <div className={styles.bg} data-orient="port" aria-hidden>
        <AssetImage id={pick(TOWER.room.port)} alt="" sizes="100vw" className={styles.bgImg} priority />
      </div>

      <Caption text={text} audioKey={`tower_${line}`} locale={locale} replayLabel={tOnb("replay")} variant="sign" className={styles.caption} testId="tower-line" />

      <div className={styles.stage}>
        <div className={styles.feelio} data-mood={m}>
          {storm ? <AssetImage id={storm} alt="" sizes="20vmin" className={styles.storm} /> : null}
          <Mascot pose={pose} label={text} sizes="30vmin" className={styles.mascot} />
        </div>

        <div className={styles.towerSpot} aria-label={t("tower")} role="img">
          {standing ? (
            <>
              <AssetImage id={pick(TOWER.tower)} alt="" sizes="24vmin" className={styles.towerGhost} />
              <span className={styles.towerReveal} style={{ clipPath: `inset(${100 - (s.height / TOWER_HEIGHT) * 100}% 0 0 0)` }}>
                <AssetImage id={pick(TOWER.tower)} alt="" sizes="24vmin" className={styles.towerImg} />
              </span>
            </>
          ) : (
            <AssetImage id={pick(TOWER.fallen)} alt="" sizes="24vmin" className={styles.fallen} />
          )}
        </div>

        <div className={styles.nori} data-pose={nori ?? "away"}>
          {nori ? <AssetImage id={pick(TOWER.nori[nori])} alt={t("nori")} sizes="22vmin" className={styles.noriImg} /> : null}
        </div>
      </div>

      <div className={styles.controls}>
        {building ? (
          <ActionObject art={pick(TOWER.blocks)} label={t("blocks")} sizes="22vmin" ready onPress={() => { play("pop"); send({ type: "block" }); }} className={styles.blocks} testId="tower-block" />
        ) : null}

        {s.beat === "feel" ? (
          <div className={styles.faces} role="group" aria-label={t("feel")}>
            {FACES.map((f) => (
              <button key={f} type="button" className={styles.face} aria-label={t(`faces.${f}`)} data-testid={`tower-face-${f}`} onClick={() => { play("pick"); send({ type: "face", face: f }); }}>
                <AssetImage id={pick(TOWER.face[f])} alt="" sizes="16vmin" className={styles.faceImg} />
                <span className={styles.faceWord}>{t(`faces.${f}`)}</span>
              </button>
            ))}
          </div>
        ) : null}

        {shown.length ? (
          <div className={styles.choices} role="group" aria-label={t("choose")}>
            {CHOICES.map((c: Choice) =>
              shown.includes(c) ? (
                <button key={c} type="button" className={styles.choice} data-testid={`tower-choice-${c}`} aria-label={t(`cards.${c}`)} onClick={() => { play("pick"); send({ type: "pick", choice: c }); }}>
                  <ChoiceDisc art={pickOptional(TOWER.card[c])} word={t(`cards.${c}`)} size="md" />
                  {pickOptional(TOWER.card[c]) ? <span className={styles.choiceWord}>{t(`cards.${c}`)}</span> : null}
                </button>
              ) : null,
            )}
            {s.beat === "choose" ? (
              <ActionObject art={pick(TOWER.cloud)} label={t("breathe")} sizes="18vmin" ready onPress={() => send({ type: "calm" })} className={styles.cloud} testId="tower-calm" />
            ) : null}
          </div>
        ) : null}

        {s.beat === "breathe" ? (
          <div className={styles.breath} data-phase={s.breaths % 2 === 0 ? "in" : "out"} aria-hidden>
            <AssetImage id={pick(TOWER.cloud)} alt="" sizes="30vmin" className={styles.breathImg} />
          </div>
        ) : null}

        {s.beat === "stomp" || s.beat === "shout" ? (
          <Pressable label={t("rewind")} icon={<Undo2 size={28} strokeWidth={3} aria-hidden />} tone="primary" onPress={() => send({ type: "rewind" })} testId="tower-rewind" />
        ) : null}

        {auto === "next" ? (
          <Pressable label={t("next")} icon={<ArrowRight size={28} strokeWidth={3} aria-hidden className={styles.flip} />} onPress={() => send({ type: "next" })} testId="tower-next" />
        ) : null}

        {s.beat === "end" ? (
          <div className={styles.end}>
            <div className={styles.trick} data-testid="tower-trick">
              {pickOptional(TOWER.burst) ? <AssetImage id={pick(TOWER.burst)} alt="" sizes="20vmin" className={styles.burst} /> : null}
              <AssetImage id={pick(TOWER.cloud)} alt="" sizes="14vmin" className={styles.trickImg} />
              <span>{t("trick")}</span>
            </div>
            <p className={styles.journal} data-testid="tower-journal">
              <BookOpen size={22} strokeWidth={3} aria-hidden /> {t("journal", { n: s.found.length, total: CHOICES.length })}
            </p>
            <div className={styles.endRow}>
              <Pressable label={t("again")} icon={<RotateCcw size={26} strokeWidth={3} aria-hidden />} onPress={() => send({ type: "again" })} testId="tower-again" />
              <Pressable label={t("finish")} tone="primary" onPress={onComplete} testId="tower-finish" />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
