import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getChild } from "@/auth/guards";
import { getChildView } from "@/child/view";
import { Avatar } from "@/child/ui/Avatar";
import { Dock } from "@/child/ui/Dock";
import { NameSign } from "@/child/ui/NameSign";
import { Scene } from "@/child/ui/Scene";
import { SayLine } from "../SayLine";
import { Heartbeat } from "../Heartbeat";
import { SoundSetting } from "../SoundSetting";
import { TimeUp } from "../TimeUp";
import styles from "../child.module.css";

// My collection (first version): the child's own character, its companion and its name. Collected
// mascot moments arrive with scenarios (Milestone 4).
export default async function Collection() {
  const child = await getChild();
  if (!child) redirect("/");
  const view = await getChildView(child);
  if (!view?.onboarding.done) redirect("/");
  if (view.timeUp) return <TimeUp />;
  const t = await getTranslations("child.collection");
  return (
    <>
      <SoundSetting on={view.sound} />
      <Heartbeat />
      <Scene land="scene_meadow_land" port="scene_meadow_port" alt="" testId="collection">
        <div className={styles.collection}>
          <SayLine text={t("intro")} audioKey="collection_intro" />
          <div className={styles.collectionRow}>
            <Avatar avatar={view.avatar} cheer sizes="36vmin" className={styles.collectionAvatar} />
            {view.name ? <NameSign text={view.name} className={styles.collectionName} testId="child-name" /> : null}
          </div>
        </div>
      </Scene>
      <Dock active="collection" stories={view.features.stories} />
    </>
  );
}
