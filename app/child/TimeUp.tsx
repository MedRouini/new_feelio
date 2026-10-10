import { getTranslations } from "next-intl/server";
import { Mascot } from "@/child/ui/Mascot";
import { Scene } from "@/child/ui/Scene";
import { SayLine } from "./SayLine";
import styles from "./child.module.css";

// Today's time is used up (decided on the server). A warm goodbye, never a plea to stay (MASCOT.md).
export async function TimeUp() {
  const t = await getTranslations("child");
  return (
    <Scene land="scene_meadow_land" port="scene_meadow_port" alt="" testId="time-up">
      <div className={styles.notSetUp}>
        <SayLine text={t("timeUp")} audioKey="time_up" />
        <Mascot pose="mascot_sleeping" label={t("onb.aiSign")} sizes="34vmin" className={styles.bigMascot} />
      </div>
    </Scene>
  );
}
