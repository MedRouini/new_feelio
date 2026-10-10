import { getTranslations } from "next-intl/server";
import { Mascot } from "@/child/ui/Mascot";
import { Scene } from "@/child/ui/Scene";
import { SayLine } from "../SayLine";
import styles from "../child.module.css";

// Shown by the service worker when there is no connection (ARCHITECTURE §5.5). No child data here.
export default async function Offline() {
  const t = await getTranslations("child");
  return (
    <Scene land="scene_meadow_land" port="scene_meadow_port" alt="" testId="offline">
      <div className={styles.notSetUp}>
        <SayLine text={t("offline.line")} audioKey="offline_line" />
        <Mascot pose="mascot_sleeping" label={t("onb.aiSign")} sizes="34vmin" className={styles.bigMascot} />
      </div>
    </Scene>
  );
}
