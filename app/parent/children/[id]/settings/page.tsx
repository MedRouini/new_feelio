import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Button } from "@/design/components/Button";
import { Card } from "@/design/components/Card";
import { decryptField } from "@/platform/crypto";
import { getChildInHousehold, getHousehold, getSettings } from "@/parent/operations";
import { isValidWindow } from "@/platform/time";
import { updateSettingsAction } from "../../../actions";
import { requireParentPage } from "../../../page-guard";
import styles from "../../../parent.module.css";

// Every half hour, plus midnight as an end time ("24:00").
const TIMES = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`);
// 2026-10-11 is a Sunday: day 0 + n gives each weekday's name in the parent's language.
const weekdayName = (d: number, locale: string) => new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(new Date(Date.UTC(2026, 9, 11 + d)));
const timeLabel = (hhmm: string, locale: string) =>
  new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(new Date(Date.UTC(2026, 0, 1, Number(hhmm.slice(0, 2)), Number(hhmm.slice(3)))));

// Parent setup step 3 (ONBOARDING.md §1): what this child may use and when. Enforced on the server (CR-2).
export default async function ChildSettings({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ setup?: string; error?: string }> }) {
  const { id } = await params;
  const { setup, error } = await searchParams;
  const parent = await requireParentPage(`/children/${id}/settings`, { gate: "area", needHousehold: true });
  const child = await getChildInHousehold(parent.householdId!, id);
  const s = await getSettings(parent.householdId!, id);
  if (!child || !s) notFound();
  const [t, locale, home] = await Promise.all([getTranslations("parent"), getLocale(), getHousehold(parent.householdId!)]);
  const intl = locale === "ar" ? "ar-EG" : "en";
  const name = (child.nicknameEnc && decryptField(child.nicknameEnc)) || t("child");
  const w = s.schedule.find(isValidWindow) ?? { days: [0, 1, 2, 3, 4, 5, 6], start: "07:00", end: "20:00" };

  return (
    <Card>
      <form action={updateSettingsAction} className={styles.stack}>
        {setup ? <p className={styles.muted}>{t("stepOf", { n: 3 })}</p> : null}
        <h1 className={styles.h1}>{t("settingsTitle", { name })}</h1>
        <input type="hidden" name="childId" value={id} />
        {setup ? <input type="hidden" name="setup" value="1" /> : null}

        <label className={styles.check}>
          <input type="checkbox" name="scenarios" defaultChecked={s.features.scenarios} />
          <span>{t("scenariosSetting")}</span>
        </label>
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

        <fieldset className={styles.fieldset} data-testid="allowed-hours">
          <legend className={styles.label}>{t("hoursTitle")}</legend>
          <p className={styles.muted}>{t("hoursNote", { zone: home?.timezone ?? "UTC" })}</p>
          {error === "hours" ? <p className={styles.error} role="alert">{t("hoursError")}</p> : null}
          <div className={styles.days}>
            {[0, 1, 2, 3, 4, 5, 6].map((d) => (
              <label key={d} className={styles.check}>
                <input type="checkbox" name="day" value={d} defaultChecked={w.days.includes(d)} />
                <span>{weekdayName(d, intl)}</span>
              </label>
            ))}
          </div>
          <div className={styles.row}>
            <label>
              <span className={styles.label}>{t("hoursFrom")}</span>
              <select name="start" className={styles.select} defaultValue={w.start}>
                {TIMES.map((v) => (
                  <option key={v} value={v}>{timeLabel(v, intl)}</option>
                ))}
              </select>
            </label>
            <label>
              <span className={styles.label}>{t("hoursTo")}</span>
              <select name="end" className={styles.select} defaultValue={w.end}>
                {[...TIMES.slice(1), "24:00"].map((v) => (
                  <option key={v} value={v}>{v === "24:00" ? t("midnight") : timeLabel(v, intl)}</option>
                ))}
              </select>
            </label>
          </div>
        </fieldset>

        <label className={styles.check}>
          <input type="checkbox" name="sound" defaultChecked={s.sound} />
          <span>{t("soundSetting")}</span>
        </label>
        <Button type="submit">{t("saveSettings")}</Button>
      </form>
    </Card>
  );
}
