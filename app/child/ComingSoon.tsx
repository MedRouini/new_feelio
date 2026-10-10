import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getChild } from "@/auth/guards";
import { getChildView } from "@/child/view";
import { Dock, type DockItem } from "@/child/ui/Dock";
import { Mascot } from "@/child/ui/Mascot";
import { Scene } from "@/child/ui/Scene";
import { AssetImage } from "@/design/components/AssetImage";
import type { AssetId } from "@/design/assets";
import { Heartbeat } from "./Heartbeat";
import { SayLine } from "./SayLine";
import { TimeUp } from "./TimeUp";
import styles from "./child.module.css";

/**
 * An honest "not built yet" screen for a dock destination (Talk: Milestone 5, Stories: Milestone 6,
 * Calm: not scheduled yet, D-055).
 * No fake functionality (CR-4): the mascot says plainly that it is coming, and the dock leads back.
 * Listed in docs/PLACEHOLDERS.md as a known gap, not hidden.
 */
export async function ComingSoon({ item, art, line }: { item: DockItem; art: AssetId; line: "talk" | "stories" | "calm" }) {
  const child = await getChild();
  if (!child) redirect("/");
  const view = await getChildView(child);
  if (!view?.onboarding.done) redirect("/");
  if (view.timeUp) return <TimeUp />;
  // Parent switched Stories off: the screen does not exist for this child (server-side, CR-2).
  if (item === "stories" && !view.features.stories) redirect("/");
  const t = await getTranslations("child");
  return (
    <>
      <Heartbeat />
      <Scene land="scene_meadow_land" port="scene_meadow_port" alt="" testId={`soon-${item}`}>
        <div className={styles.soon}>
          <SayLine text={t(`soon.${line}`)} audioKey={`soon_${line}`} />
          <div className={styles.soonRow}>
            <Mascot pose="mascot_happy" label={t("onb.aiSign")} sizes="34vmin" className={styles.bigMascot} />
            <AssetImage id={art} alt="" sizes="22vmin" className={styles.soonDock} />
          </div>
        </div>
      </Scene>
      <Dock active={item} stories={view.features.stories} />
    </>
  );
}
