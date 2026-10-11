import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Clock3, Shapes, Volume2 } from "lucide-react";
import { Button } from "@/design/components/Button";
import { decryptField } from "@/platform/crypto";
import { getChildInHousehold, getHousehold, getSettings } from "@/parent/operations";
import { isValidWindow } from "@/platform/time";
import { deleteChildAction, updateSettingsAction } from "../../../actions";
import { requireParentPage } from "../../../page-guard";
import styles from "../../../parent.module.css";

// Every half hour, plus midnight as an end time ("24:00").
const TIMES = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`);
// 2026-10-11 is a Sunday: day 0 + n gives each weekday's name in the parent's language.
const weekdayName = (d: number, locale: string) => new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(new Date(Date.UTC(2026, 9, 11 + d)));
const timeLabel = (hhmm: string, locale: string) =>
  new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(new Date(Date.UTC(2026, 0, 1, Number(hhmm.slice(0, 2)), Number(hhmm.slice(3)))));

// Controls tab (parent setup step 3, ONBOARDING.md §1): what this child may use, how long and when.
// Everything is enforced on the server (CR-2, D-065).
export default async function ChildControls({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ setup?: string; error?: string; saved?: string }> }) {
  const { id } = await params;
  const { setup, error, saved } = await searchParams;
  const parent = await requireParentPage(`/children/${id}/settings`, { gate: "area", needHousehold: true });
  const child = await getChildInHousehold(parent.householdId!, id);
  const s = await getSettings(parent.householdId!, id);
  if (!child || !s) notFound();
  const [t, locale, home] = await Promise.all([getTranslations("parent"), getLocale(), getHousehold(parent.householdId!)]);
  const intl = locale === "ar" ? "ar-EG" : "en";
  const name = (child.nicknameEnc && decryptField(child.nicknameEnc)) || t("child");
  const w = s.schedule.find(isValidWindow) ?? { days: [0, 1, 2, 3, 4, 5, 6], start: "07:00", end: "20:00" };
  const minutes = [15, 30, 45].includes(s.dailyMinutes) ? s.dailyMinutes : 30;

  const toggle = (nameAttr: string, title: string, note: string | null, checked: boolean) => (
    <label className={styles.switchRow}>
      <span className={styles.switchText}>
        <span className={styles.switchTitle}>{title}</span>
        {note ? <span className={[styles.muted, styles.small].join(" ")}>{note}</span> : null}
      </span>
      <input type="checkbox" role="switch" name={nameAttr} defaultChecked={checked} className={styles.switch} aria-label={title} />
    </label>
  );

  return (
    <>
      <form action={updateSettingsAction} className={styles.stack}>
        <h2 className={styles.sectionTitle}>{t("settingsTitle", { name })}</h2>
        {setup ? <p className={styles.notice}>{t("stepOf", { n: 3 })}</p> : null}
        {saved ? (
          <p className={styles.success} role="status">
            {t("settingsSaved")}
          </p>
        ) : null}
        <input type="hidden" name="childId" value={id} />
        {setup ? <input type="hidden" name="setup" value="1" /> : null}

        <section className={styles.card} aria-labelledby="what-title">
          <div className={styles.sectionHead}>
            <span className={styles.iconTile} data-tone="purple">
              <Shapes size={20} aria-hidden />
            </span>
            <h3 id="what-title" className={styles.sectionTitle}>{t("whatTitle")}</h3>
          </div>
          <div>
            {toggle("scenarios", t("scenariosSetting"), null, s.features.scenarios)}
            {toggle("talk", t("talkSetting"), t("talkNote"), s.features.talk)}
            {toggle("stories", t("storiesSetting"), null, s.features.stories)}
          </div>
        </section>

        <section className={styles.card} aria-labelledby="time-title">
          <div className={styles.sectionHead}>
            <span className={styles.iconTile} data-tone="amber">
              <Clock3 size={20} aria-hidden />
            </span>
            <h3 id="time-title" className={styles.sectionTitle}>{t("timeSection")}</h3>
          </div>
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>{t("dailySetting")}</legend>
            <div className={styles.segmented}>
              {[15, 30, 45].map((m) => (
                <label key={m}>
                  <input type="radio" name="dailyMinutes" value={m} defaultChecked={m === minutes} />
                  <span>{t("minutes", { n: new Intl.NumberFormat(intl).format(m) })}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className={styles.fieldset} data-testid="allowed-hours">
            <legend className={styles.legend}>{t("hoursTitle")}</legend>
            <p className={[styles.muted, styles.small].join(" ")}>{t("hoursNote", { zone: home?.timezone ?? "UTC" })}</p>
            {error === "hours" ? <p className={styles.error} role="alert">{t("hoursError")}</p> : null}
            <div className={styles.chips}>
              {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                <label key={d}>
                  <input type="checkbox" name="day" value={d} defaultChecked={w.days.includes(d)} aria-label={weekdayName(d, intl)} />
                  <span>{weekdayName(d, intl)}</span>
                </label>
              ))}
            </div>
            <div className={styles.timeRow}>
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
        </section>

        <section className={styles.card} aria-labelledby="sound-title">
          <div className={styles.sectionHead}>
            <span className={styles.iconTile} data-tone="blue">
              <Volume2 size={20} aria-hidden />
            </span>
            <h3 id="sound-title" className={styles.sectionTitle}>{t("soundSection")}</h3>
          </div>
          <div>{toggle("sound", t("soundSetting"), null, s.sound)}</div>
        </section>

        <div className={styles.actions}>
          <Button type="submit">{t("saveSettings")}</Button>
        </div>
      </form>

      {setup ? null : (
        <form action={deleteChildAction} className={styles.dangerZone}>
          <h3 className={styles.dangerTitle}>{t("deleteChild")}</h3>
          <p className={styles.muted}>{t("deleteChildConfirm")}</p>
          <input type="hidden" name="childId" value={id} />
          <div className={styles.actions}>
            <Button variant="quietDanger" type="submit">{t("deleteChild")}</Button>
          </div>
        </form>
      )}
    </>
  );
}
