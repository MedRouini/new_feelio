import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Button } from "@/design/components/Button";
import { Card } from "@/design/components/Card";
import { Field } from "@/design/components/Field";
import { decryptField } from "@/platform/crypto";
import { PARENT_REPORT_CATEGORIES } from "@/platform/db/schema";
import { formatLocalTime } from "@/platform/time";
import { childOverview } from "@/parent/insights";
import { getChildInHousehold, listDevices } from "@/parent/operations";
import { createReportAction, deleteChildAction, revokeDeviceAction } from "../../actions";
import { requireParentPage } from "../../page-guard";
import styles from "../../parent.module.css";

export default async function ChildDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ setup?: string; report?: string }> }) {
  const { id } = await params;
  const { setup, report } = await searchParams;
  const parent = await requireParentPage(`/children/${id}`, { gate: "area", needHousehold: true });
  const child = await getChildInHousehold(parent.householdId!, id);
  if (!child) notFound();
  const [t, ta, locale, overview] = await Promise.all([getTranslations("parent"), getTranslations("ageBands"), getLocale(), childOverview(parent.householdId!, id)]);
  if (!overview) notFound();
  const intl = locale === "ar" ? "ar-EG" : "en";
  const lang = locale === "ar" ? "ar" : "en";
  const n = (v: number) => new Intl.NumberFormat(intl).format(v);
  const name = (child.nicknameEnc && decryptField(child.nicknameEnc)) || t("child");
  const devices = (await listDevices({ userId: parent.userId, householdId: parent.householdId! })).filter((d) => d.meta.childId === child.id);
  const fmt = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : t("never"));
  // "Mon 5" / "الاثنين ٥": weekday first, then the day of the month (the parts are joined in a fixed order).
  const dayName = (iso: string) => {
    const d = new Date(`${iso}T12:00:00Z`);
    const part = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(intl, { ...o, timeZone: "UTC" }).format(d);
    return `${part({ weekday: "short" })} ${part({ day: "numeric" })}`;
  };
  const dateOf = (d: Date) => new Intl.DateTimeFormat(intl, { day: "numeric", month: "short" }).format(d);
  // One scale for the week: the daily limit, or more if a day went over it (e.g. the limit was lowered).
  const scale = Math.max(overview.dailyMinutes, ...overview.week.map((d) => d.minutes), 1);
  const pause = overview.pause;

  return (
    <>
      <Card>
        <div className={styles.stack}>
          <h1 className={styles.h1}>{name}</h1>
          <p className={styles.muted}>{ta(child.ageBand)}</p>
          <p data-testid="today-time">{t("todayUsed", { used: n(overview.today), limit: n(overview.dailyMinutes) })}</p>
          {pause?.reason === "outside_hours" ? (
            <p className={styles.notice} data-testid="pause-status">
              {pause.nextAt ? t("restingUntil", { time: formatLocalTime(pause.nextAt, pause.zone, lang) }) : t("restingNow")}
            </p>
          ) : pause?.reason === "time_up" ? (
            <p className={styles.notice} data-testid="pause-status">{t("timeUpNow")}</p>
          ) : null}
          <a href={`/children/${child.id}/settings`}>{t("changeSettings")}</a>
        </div>
      </Card>

      <Card>
        <section className={styles.stack} aria-labelledby="week-title">
          <h2 id="week-title" className={styles.h1}>{t("weekTitle")}</h2>
          <p className={styles.muted}>{t("weekLimit", { n: n(overview.dailyMinutes) })}</p>
          {/* A list, not a picture: every bar carries its number in text (also the table view). */}
          <ul className={styles.week} data-testid="week" style={{ ["--limit" as string]: `${(overview.dailyMinutes / scale) * 100}%` }}>
            {overview.week.map((d) => (
              <li key={d.day} className={styles.weekRow} title={t("minutesOn", { day: dayName(d.day), n: n(d.minutes) })}>
                <span className={styles.weekDay}>{dayName(d.day)}</span>
                <span className={styles.weekTrack} aria-hidden>
                  <span className={styles.weekBar} style={{ inlineSize: `${(d.minutes / scale) * 100}%` }} />
                  <span className={styles.weekLimit} />
                </span>
                <span className={styles.weekValue}>{t("minutesShort", { n: n(d.minutes) })}</span>
              </li>
            ))}
          </ul>
        </section>
      </Card>

      <Card>
        <section className={styles.stack} aria-labelledby="progress-title">
          <h2 id="progress-title" className={styles.h1}>{t("progressTitle")}</h2>
          <ul className={styles.list} data-testid="progress">
            {overview.places.map((p) => (
              <li key={p.id} className={styles.row} data-place={p.id} data-state={p.state}>
                <strong>{p.name[lang]}</strong>
                <span className={styles.muted}>
                  {p.state === "locked" ? t("placeLocked") : p.state === "completed" ? t("placeDone") : t("placeProgress", { done: n(p.completedCount), total: n(p.total) })}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </Card>

      <Card>
        <section className={styles.stack} aria-labelledby="notes-title">
          <h2 id="notes-title" className={styles.h1}>{t("summariesTitle")}</h2>
          {overview.summaries.length === 0 ? <p className={styles.muted}>{t("summariesNone")}</p> : null}
          <ul className={styles.list} data-testid="summaries">
            {overview.summaries.map((s) => (
              <li key={s.id} className={styles.stack}>
                <small className={styles.muted}>{dateOf(s.at)}</small>
                <span>{t(`summary.${s.kind}` as "summary.steered")}</span>
              </li>
            ))}
          </ul>
          <p className={styles.muted}>
            {t("summariesNote")} <a href="/guide">{t("navGuide")}</a>
          </p>
        </section>
      </Card>

      <Card>
        <form action={createReportAction} className={styles.stack} data-testid="report-form">
          <h2 className={styles.h1}>{t("reportTitle")}</h2>
          <p className={styles.muted}>{t("reportIntro")}</p>
          {report === "sent" ? <p className={styles.notice} role="status">{t("reportSent")}</p> : null}
          {report === "error" ? <p className={styles.error} role="alert">{t("reportError")}</p> : null}
          <input type="hidden" name="childId" value={child.id} />
          <label>
            <span className={styles.label}>{t("reportCategory")}</span>
            <select name="category" className={styles.select} defaultValue="upsetting" required>
              {PARENT_REPORT_CATEGORIES.map((c) => (
                <option key={c} value={c}>{t(`reportCategories.${c}` as "reportCategories.other")}</option>
              ))}
            </select>
          </label>
          <label>
            <span className={styles.label}>{t("reportNote")}</span>
            <textarea name="note" maxLength={500} rows={3} className={styles.textarea} />
          </label>
          <Button variant="secondary" type="submit">{t("reportSend")}</Button>
        </form>
      </Card>

      <Card>
        <div className={styles.stack}>
          <h2 className={styles.h1}>{t("devicesTitle")}</h2>
          {devices.length === 0 ? <p className={styles.muted}>{t("noDevices")}</p> : null}
          <ul className={styles.list}>
            {devices.map((d) => (
              <li key={d.id} className={styles.row}>
                <span>
                  <strong>{d.name}</strong> <span className={styles.muted}>{d.start}…</span>
                  <br />
                  <small className={styles.muted}>
                    {t("lastUsed")}: {fmt(d.lastRequest)} · {t("expires")}: {fmt(d.expiresAt)}
                  </small>
                </span>
                <form action={revokeDeviceAction}>
                  <input type="hidden" name="keyId" value={d.id} />
                  <input type="hidden" name="next" value={`/children/${child.id}`} />
                  <Button variant="secondary" type="submit">{t("revoke")}</Button>
                </form>
              </li>
            ))}
          </ul>
          <form method="post" action="/api/parent/devices" className={styles.stack}>
            {setup ? <p className={styles.notice}>{t("stepOf", { n: 4 })}: {t("handOver", { name })}</p> : null}
            <p className={styles.muted}>{t("setUpHint")}</p>
            <input type="hidden" name="childId" value={child.id} />
            <Field label={t("deviceLabel")} name="label" maxLength={32} defaultValue="Tablet" />
            <Button type="submit">{t("setUpThisDevice", { name })}</Button>
          </form>
        </div>
      </Card>

      <Card className={styles.danger}>
        <form action={deleteChildAction} className={styles.stack}>
          <p>{t("deleteChildConfirm")}</p>
          <input type="hidden" name="childId" value={child.id} />
          <Button variant="quietDanger" type="submit">{t("deleteChild")}</Button>
        </form>
      </Card>
    </>
  );
}
