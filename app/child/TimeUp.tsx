import { getLocale, getTranslations } from "next-intl/server";
import type { Pause } from "@/child/usage";
import { Mascot } from "@/child/ui/Mascot";
import { Scene } from "@/child/ui/Scene";
import { formatLocalTime } from "@/platform/time";
import { SayLine } from "./SayLine";
import styles from "./child.module.css";

// The child can't play right now (decided on the server): today's time is used up, or it is outside
// the hours the parent allows. A warm goodbye with Feelio asleep, never a plea to stay (MASCOT.md).
export async function TimeUp({ pause }: { pause: Pause }) {
  const t = await getTranslations("child");
  const locale = (await getLocale()) === "ar" ? "ar" : "en";
  let text = t("timeUp");
  let audioKey: string | undefined = "time_up";
  if (pause?.reason === "outside_hours") {
    if (pause.nextAt && pause.sameDay) {
      text = t("resting", { time: formatLocalTime(pause.nextAt, pause.zone, locale) });
      audioKey = undefined; // has a time in it: caption only
    } else {
      text = t("restingLater");
      audioKey = "resting_later";
    }
  }
  return (
    <Scene land="scene_meadow_land" port="scene_meadow_port" alt="" testId="time-up">
      <div className={styles.notSetUp} data-reason={pause?.reason ?? "time_up"}>
        <SayLine text={text} audioKey={audioKey} />
        <Mascot pose="mascot_sleeping" label={t("onb.aiSign")} sizes="34vmin" className={styles.bigMascot} />
      </div>
    </Scene>
  );
}
