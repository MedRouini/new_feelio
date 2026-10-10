"use client";

import { useState, type ComponentType } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CompletionResult } from "@/child/progress";
import { Mascot } from "@/child/ui/Mascot";
import { SayLine } from "@/app/child/SayLine";
import { ThingButton } from "@/child/ui/ThingButton";
import { play } from "@/child/ui/sound";
import { LoadingScene } from "@/child/ui/loading/LoadingScene";
import { useLoad } from "@/child/ui/loading/useLoad";
import { centreOf, useTransitionTo } from "@/child/ui/loading/useTransitionTo";
import { NOT_READY_MASCOT, pick } from "@/design/asset-slots";
import { loadArtifact } from "@/world/artifacts/loaders";
import type { ArtifactProps } from "@/world/artifacts/types";
import type { PlaceProgress } from "@/world/unlock";
import { Celebration } from "./Celebration";
import styles from "./level.module.css";

type Props = {
  placeId: string;
  placeName: string;
  level: { id: string; order: number; title: string };
  levels: { id: string; order: number }[];
  progress: PlaceProgress;
  /** The level's artifacts in play order (server-decided; empty when none is built yet). */
  artifacts: string[];
  doneArtifacts: string[];
  locale: "en" | "ar";
  ageBand: "5-6" | "7-9" | "10-12";
  tint: string;
  placeNames: Record<string, string>;
};

async function post(action: "start" | "complete", levelId: string, artifactId: string) {
  const res = await fetch("/api/child/progress", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action, levelId, artifactId }),
  });
  if (!res.ok) throw new Error(`progress ${action} failed`);
  return res.json();
}

/**
 * Plays one level (D-056, docs/LEVEL_FLOW.md §2): loads each artifact with the shared loading scene,
 * records "started" and "completed" on the server, then celebrates and shows what unlocked.
 * The player owns all of that; an artifact only plays and calls onComplete or onExit.
 */
export function LevelPlayer(props: Props) {
  const { placeId, placeName, level, artifacts, doneArtifacts, locale, ageBand, tint } = props;
  const t = useTranslations("child");
  const [go, transition] = useTransitionTo();
  // First artifact not finished yet; when all are (a replay), start from the first.
  const [current, setCurrent] = useState<string | null>(() => artifacts.find((a) => !doneArtifacts.includes(a)) ?? artifacts[0] ?? null);
  const [saving, setSaving] = useState<"no" | "saving" | "problem">("no");
  const [result, setResult] = useState<CompletionResult | null>(null);

  const load = useLoad<ComponentType<ArtifactProps> | null>(
    async () => {
      if (!current) return null;
      const [mod] = await Promise.all([loadArtifact(current), post("start", level.id, current)]);
      return mod.default;
    },
    current ?? "none",
  );

  const backToPlace = (from?: Element | null) => go(`/place/${placeId}`, { context: "place", placeId, from: centreOf(from ?? null), tint });

  const complete = async () => {
    if (!current) return;
    setSaving("saving");
    try {
      const r: CompletionResult = await post("complete", level.id, current);
      if (r.nextArtifactId) {
        setSaving("no");
        setCurrent(r.nextArtifactId);
        return;
      }
      play("unlock");
      setResult(r);
      setSaving("no");
    } catch {
      setSaving("problem");
    }
  };

  const leave = (
    <button
      type="button"
      className={styles.leave}
      aria-label={t("level.leave")}
      data-testid="level-leave"
      onClick={(e) => {
        play("tap");
        backToPlace(e.currentTarget);
      }}
    >
      <X size={36} strokeWidth={3} aria-hidden />
    </button>
  );

  // Nothing built for this level yet: say so plainly (CR-4), never pretend.
  if (!current) {
    return (
      <div className={styles.screen} style={{ background: tint }} data-testid="level-not-ready">
        {leave}
        <div className={styles.notReady}>
          <SayLine text={t("level.notReady")} audioKey="level_notReady" />
          <Mascot pose={pick(NOT_READY_MASCOT)} label={t("level.notReady")} sizes="34vmin" className={styles.bigMascot} />
          <ThingButton
            art="dock_map"
            label={t("level.back", { place: placeName })}
            showLabel
            sizes="120px"
            className={styles.backThing}
            onPress={() => backToPlace(document.querySelector('[data-testid="level-back"]'))}
            testId="level-back"
          />
        </div>
        {transition}
      </div>
    );
  }

  if (result) {
    return (
      <>
        <Celebration {...props} result={result} onNext={(href, from) => go(href, { context: href === "/" ? "generic" : "place", placeId, from: centreOf(from), tint })} />
        {transition}
      </>
    );
  }

  const Artifact = load.data;
  return (
    <div className={styles.screen} style={{ background: tint }} data-testid="level-screen" data-level={level.id}>
      {leave}
      <div className={styles.stage}>
        {load.phase === "ready" && Artifact ? (
          <Artifact
            key={current}
            artifactId={current}
            levelId={level.id}
            locale={locale}
            ageBand={ageBand}
            onComplete={complete}
            onExit={() => backToPlace()}
          />
        ) : null}
      </div>
      {load.phase !== "ready" ? <LoadingScene context="level" tint={tint} phase={load.phase} onRetry={load.retry} /> : null}
      {saving !== "no" ? (
        <LoadingScene context="level" tint={tint} caption={t("loading.saving")} phase={saving === "problem" ? "problem" : "loading"} onRetry={complete} />
      ) : null}
      {transition}
    </div>
  );
}
