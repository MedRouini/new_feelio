"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Pause, Play, RotateCcw, SkipForward, X } from "lucide-react";
import { ACTIVITY_STEPS, find, pause, progressOf, restart, resume, skip, tick, type Run } from "@/child/activities";
import { ActionObject } from "@/child/ui/ActionObject";
import { Caption } from "@/child/ui/Caption";
import { Mascot } from "@/child/ui/Mascot";
import { Pressable } from "@/child/ui/Pressable";
import { play } from "@/child/ui/sound";
import { useLine } from "@/child/ui/useLine";
import { AssetImage } from "@/design/components/AssetImage";
import { pick } from "@/design/asset-slots";
import styles from "./activity.module.css";

/** The clock, read only in event handlers and effects. */
const now = () => Date.now();

/**
 * A calm activity in Feelio's nook (D-076): breathing with the cloud, the noticing game, or stretching
 * with Feelio. The run is pure state (child/activities.ts); this screen keeps its clock, plays Feelio's
 * pre-recorded line for each step, and draws the step. The rhythm is the app's, so voice and picture
 * stay together, and pausing stops both. The child can pause, skip, start again or stop at any time.
 */
export function ActivityStage({
  run,
  update,
  onExit,
  onTalk,
  canTalk,
  locale,
  calm,
}: {
  run: Run;
  update: (f: (r: Run) => Run) => void;
  onExit: () => void;
  onTalk: () => void;
  canTalk: boolean;
  locale: "en" | "ar";
  calm: boolean;
}) {
  const t = useTranslations("child.talk.act");
  const tTalk = useTranslations("child.talk");
  const tOnb = useTranslations("child.onb");
  const step = ACTIVITY_STEPS[run.activity][run.step];
  const done = run.status === "done";
  const paused = run.status === "paused";
  const progress = progressOf(run);
  const stage = useRef<HTMLDivElement>(null);

  // The clock: a timed step ends exactly when it should (and never while paused).
  useEffect(() => {
    if (run.status !== "running" || run.endsAt === null) return;
    const id = setTimeout(() => update((r) => tick(r, Date.now())), Math.max(0, run.endsAt - Date.now()));
    return () => clearTimeout(id);
  }, [run, update]);

  // The step's progress, 0..1, as CSS variables set every frame (no re-render): the cloud's size, the
  // seconds lighting up, the time ribbon under Feelio. Paused, it holds still where it was.
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ms = step.ms;
    const set = (p: number) => {
      const q = Math.min(1, Math.max(0, p));
      el.style.setProperty("--p", q.toFixed(4));
      el.style.setProperty("--e", (0.5 - Math.cos(Math.PI * q) / 2).toFixed(4));
      el.style.setProperty("--sec", ms ? String(Math.min(Math.ceil(ms / 1000), Math.floor((q * ms) / 1000) + 1)) : "0");
    };
    if (!ms) return set(0);
    if (run.status === "paused") return set(1 - (run.left ?? ms) / ms);
    if (run.status !== "running" || run.endsAt === null) return set(1);
    const endsAt = run.endsAt;
    let raf = 0;
    const frame = () => {
      set(1 - (endsAt - Date.now()) / ms);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [run, step.ms]);

  // Feelio's line for the step, paused with the activity.
  useLine(step.line, locale, !paused, `${run.activity}:${run.step}`);

  // Escape stops the activity, like the Stop button.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onExit();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onExit]);

  const line = paused ? t("paused") : t(step.say);

  return (
    <div
      ref={stage}
      className={styles.activity}
      data-activity={run.activity}
      data-kind={step.kind}
      data-status={run.status}
      data-move={step.move}
      data-calm={calm || undefined}
      data-testid="activity"
      style={{ ["--ms" as string]: `${step.ms ?? 0}ms` }}
    >
      <ol className={styles.pips} aria-label={t("steps", { n: Math.min(progress.done + 1, progress.total), total: progress.total })} data-testid="activity-progress">
        {Array.from({ length: progress.total }, (_, i) => (
          <li key={i} data-on={i < progress.done || undefined} data-now={(!done && i === progress.done) || undefined} />
        ))}
      </ol>

      <div className={styles.scene}>
        {done ? <AssetImage id="ui_celebrate_burst" alt="" sizes="40vmin" className={styles.burst} /> : null}
        {run.activity === "breathing" ? (
          <div className={styles.sky} aria-hidden>
            <span className={styles.cloud}>
              <AssetImage id="companion_cloud" alt="" sizes="40vmin" />
            </span>
            {step.ms && (step.kind === "in" || step.kind === "out") ? (
              <span className={styles.seconds}>
                {Array.from({ length: Math.ceil(step.ms / 1000) }, (_, i) => (
                  <i key={i} style={{ ["--i" as string]: i + 1 }} />
                ))}
              </span>
            ) : null}
          </div>
        ) : null}

        <div className={styles.feelio}>
          <Mascot pose={pick(step.pose)} label={tOnb("aiSign")} sizes="36vmin" className={styles.mascot} />
          {run.activity === "stretching" && step.kind === "move" ? <span className={styles.ribbon} aria-hidden /> : null}
        </div>

        {step.kind === "find" && step.token ? (
          <ul className={styles.tokens} data-testid="find-tokens">
            {Array.from({ length: step.count ?? 1 }, (_, i) => (
              <li key={`${run.step}-${i}`}>
                <button
                  type="button"
                  className={styles.token}
                  data-found={i < run.found || undefined}
                  disabled={i < run.found || paused}
                  aria-label={i < run.found ? t("foundAll") : t("found")}
                  onClick={() => {
                    play("pick");
                    update((r) => find(r, now()));
                  }}
                  data-testid={`find-${i}`}
                >
                  <AssetImage id={step.token!} alt="" sizes="96px" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <Caption text={line} locale={locale} replayLabel={tOnb("replay")} variant="float" className={styles.words} testId="activity-words" />

      <div className={styles.controls}>
        {done ? (
          <>
            <Pressable label={t("again")} icon={<RotateCcw size={26} aria-hidden />} onPress={() => update((r) => restart(r, now()))} testId="activity-again" />
            {canTalk ? <ActionObject art="ui_mic_object" label={tTalk("start")} ready onPress={onTalk} sizes="120px" className={styles.talk} testId="activity-talk" /> : null}
            <Pressable label={t("back")} icon={<X size={26} aria-hidden />} onPress={onExit} testId="activity-stop" />
          </>
        ) : (
          <>
            <Pressable label={t("stop")} icon={<X size={26} aria-hidden />} onPress={onExit} testId="activity-stop" />
            <Pressable
              tone="primary"
              label={paused ? t("resume") : t("pause")}
              icon={paused ? <Play size={28} aria-hidden /> : <Pause size={28} aria-hidden />}
              onPress={() => update((r) => (r.status === "paused" ? resume(r, now()) : pause(r, now())))}
              className={styles.main}
              testId="activity-pause"
            />
            <Pressable label={t("next")} icon={<SkipForward size={26} aria-hidden />} onPress={() => update((r) => skip(r, now()))} testId="activity-next" />
          </>
        )}
      </div>
    </div>
  );
}
