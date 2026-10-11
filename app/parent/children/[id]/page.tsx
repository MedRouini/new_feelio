import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { CalendarDays, Clock3, Map as MapIcon } from "lucide-react";
import { formatLocalTime } from "@/platform/time";
import { childOverview } from "@/parent/insights";
import { requireParentPage } from "../../page-guard";
import styles from "../../parent.module.css";

// Overview tab: today, this week and progress at a glance (D-066, D-067).
export default async function ChildOverview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parent = await requireParentPage(`/children/${id}`, { gate: "area", needHousehold: true });
  const [t, locale, o] = await Promise.all([getTranslations("parent"), getLocale(), childOverview(parent.householdId!, id)]);
  if (!o) notFound();
  const intl = locale === "ar" ? "ar-EG" : "en";
  const lang = locale === "ar" ? "ar" : "en";
  const n = (v: number) => new Intl.NumberFormat(intl).format(v);
  // "Mon 5" / "الاثنين ٥": weekday first, then the day of the month.
  const dayName = (iso: string) => {
    const d = new Date(`${iso}T12:00:00Z`);
    const part = (opt: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(intl, { ...opt, timeZone: "UTC" }).format(d);
    return `${part({ weekday: "short" })} ${part({ day: "numeric" })}`;
  };
  const scale = Math.max(o.dailyMinutes, ...o.week.map((d) => d.minutes), 1);
  const weekTotal = o.week.reduce((s, d) => s + d.minutes, 0);
  const levelsDone = o.places.reduce((s, p) => s + p.completedCount, 0);
  const levelsTotal = o.places.reduce((s, p) => s + p.total, 0);
  const pause = o.pause;

  return (
    <>
      {pause ? (
        <p className={styles.notice} data-testid="pause-status">
          {pause.reason === "outside_hours"
            ? pause.nextAt
              ? t("restingUntil", { time: formatLocalTime(pause.nextAt, pause.zone, lang) })
              : t("restingNow")
            : t("timeUpNow")}
        </p>
      ) : null}

      <div className={styles.stats}>
        <div className={styles.stat} data-testid="today-time">
          <p className={styles.statLabel}>
            <Clock3 size={18} aria-hidden /> {t("statToday")}
          </p>
          <p className={styles.statValue}>
            {n(o.today)} <small>{t("ofLimit", { limit: n(o.dailyMinutes) })}</small>
          </p>
          <div className={styles.meter} role="img" aria-label={t("todayUsed", { used: n(o.today), limit: n(o.dailyMinutes) })}>
            <div className={styles.meterFill} style={{ inlineSize: `${Math.min(100, (o.today / Math.max(o.dailyMinutes, 1)) * 100)}%` }} />
          </div>
        </div>
        <div className={styles.stat}>
          <p className={styles.statLabel}>
            <CalendarDays size={18} aria-hidden /> {t("statWeek")}
          </p>
          <p className={styles.statValue}>
            {n(weekTotal)} <small>{t("minutesWord")}</small>
          </p>
        </div>
        <div className={styles.stat}>
          <p className={styles.statLabel}>
            <MapIcon size={18} aria-hidden /> {t("statLevels")}
          </p>
          <p className={styles.statValue}>
            {n(levelsDone)} <small>{t("ofTotal", { total: n(levelsTotal) })}</small>
          </p>
        </div>
      </div>

      <section className={styles.card} aria-labelledby="week-title">
        <div className={styles.sectionHead}>
          <span className={styles.iconTile} data-tone="amber">
            <CalendarDays size={20} aria-hidden />
          </span>
          <h2 id="week-title" className={styles.sectionTitle}>{t("weekTitle")}</h2>
        </div>
        <p className={styles.muted}>{t("weekLimit", { n: n(o.dailyMinutes) })}</p>
        {/* A list, not a picture: every bar carries its number in text (also the table view). */}
        <ul className={styles.week} data-testid="week" style={{ ["--limit" as string]: `${(o.dailyMinutes / scale) * 100}%` }}>
          {o.week.map((d) => (
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

      <section className={styles.card} aria-labelledby="progress-title">
        <div className={styles.sectionHead}>
          <span className={styles.iconTile} data-tone="purple">
            <MapIcon size={20} aria-hidden />
          </span>
          <h2 id="progress-title" className={styles.sectionTitle}>{t("progressTitle")}</h2>
        </div>
        <ul className={styles.list} data-testid="progress">
          {o.places.map((p) => (
            <li key={p.id} className={styles.listRow} data-place={p.id} data-state={p.state}>
              <span className={styles.listTitle}>{p.name[lang]}</span>
              <span className={styles.placeState} data-state={p.state}>
                {p.state === "locked" ? t("placeLocked") : p.state === "completed" ? t("placeDone") : t("placeProgress", { done: n(p.completedCount), total: n(p.total) })}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
