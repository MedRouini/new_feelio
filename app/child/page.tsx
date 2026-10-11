import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getChild } from "@/auth/guards";
import { getChildView } from "@/child/view";
import { Dock } from "@/child/ui/Dock";
import { Mascot } from "@/child/ui/Mascot";
import { NameSign } from "@/child/ui/NameSign";
import { Scene } from "@/child/ui/Scene";
import { loadWorld } from "@/world/load";
import { MapView } from "@/world/map/MapView";
import { SayLine } from "./SayLine";
import { Heartbeat } from "./Heartbeat";
import { SoundSetting } from "./SoundSetting";
import { TimeUp } from "./TimeUp";
import styles from "./child.module.css";

// The child app's home: the world map. Before a device is set up: the welcome meadow with Feelio and
// the grown-up door. Before onboarding is finished: onboarding.
export default async function ChildHome({ searchParams }: { searchParams: Promise<{ arrive?: string }> }) {
  const child = await getChild();
  const t = await getTranslations("child");

  if (!child) {
    return (
      <Scene land="scene_meadow_land" port="scene_meadow_port" alt="" testId="not-set-up">
        <div className={styles.notSetUp}>
          <SayLine text={`${t("notSetUpTitle")} ${t("notSetUpBody")}`} audioKey="home_notSetUp" />
          <div className={styles.notSetUpMascot}>
            <NameSign text={t("onb.aiSign")} className={styles.notSetUpSign} testId="ai-sign" />
            <Mascot pose="mascot_waving" label={t("onb.aiSign")} sizes="34vmin" className={styles.bigMascot} />
          </div>
        </div>
      </Scene>
    );
  }

  const view = await getChildView(child);
  if (!view) redirect("/");
  if (!view.onboarding.done) redirect("/hello");
  if (view.timeUp) return <TimeUp pause={view.pause} />;
  const { arrive } = await searchParams;

  return (
    <>
      <SoundSetting on={view.sound} />
      <Heartbeat />
      <MapView world={loadWorld("base")} state={view.world} locale={view.locale} avatar={view.avatar} arriveFromStart={arrive === "1"} />
      <Dock active="map" stories={view.features.stories} talk={view.features.talk} />
    </>
  );
}
