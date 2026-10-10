import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Button } from "@/design/components/Button";
import { Card } from "@/design/components/Card";
import { decryptField } from "@/platform/crypto";
import { getChildInHousehold, getSettings } from "@/parent/operations";
import { updateSettingsAction } from "../../../actions";
import { requireParentPage } from "../../../page-guard";
import styles from "../../../parent.module.css";

// Parent setup step 3 (ONBOARDING.md §1): what this child may use. Enforced on the server (CR-2).
export default async function ChildSettings({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ setup?: string }> }) {
  const { id } = await params;
  const { setup } = await searchParams;
  const parent = await requireParentPage(`/children/${id}/settings`, { gate: "area", needHousehold: true });
  const child = await getChildInHousehold(parent.householdId!, id);
  const s = await getSettings(parent.householdId!, id);
  if (!child || !s) notFound();
  const t = await getTranslations("parent");
  const name = (child.nicknameEnc && decryptField(child.nicknameEnc)) || t("child");

  return (
    <Card>
      <form action={updateSettingsAction} className={styles.stack}>
        {setup ? <p className={styles.muted}>{t("stepOf", { n: 3 })}</p> : null}
        <h1 className={styles.h1}>{t("settingsTitle", { name })}</h1>
        <input type="hidden" name="childId" value={id} />
        {setup ? <input type="hidden" name="setup" value="1" /> : null}

        <label className={styles.check}>
          <input type="checkbox" name="talk" defaultChecked={s.features.talk} />
          <span>
            {t("talkSetting")}
            <br />
            <small className={styles.muted}>{t("talkNote")}</small>
          </span>
        </label>
        <label className={styles.check}>
          <input type="checkbox" name="stories" defaultChecked={s.features.stories} />
          <span>{t("storiesSetting")}</span>
        </label>
        <div>
          <label className={styles.label} htmlFor="dailyMinutes">{t("dailySetting")}</label>
          <select id="dailyMinutes" name="dailyMinutes" className={styles.select} defaultValue={String([15, 30, 45].includes(s.dailyMinutes) ? s.dailyMinutes : 30)}>
            {[15, 30, 45].map((n) => (
              <option key={n} value={n}>{t("minutes", { n })}</option>
            ))}
          </select>
        </div>
        <label className={styles.check}>
          <input type="checkbox" name="sound" defaultChecked={s.sound} />
          <span>{t("soundSetting")}</span>
        </label>
        <Button type="submit">{t("saveSettings")}</Button>
      </form>
    </Card>
  );
}
