import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { MessageSquareWarning, ShieldCheck } from "lucide-react";
import { Button } from "@/design/components/Button";
import { PARENT_REPORT_CATEGORIES } from "@/platform/db/schema";
import { childOverview } from "@/parent/insights";
import { createReportAction } from "../../../actions";
import { requireParentPage } from "../../../page-guard";
import styles from "../../../parent.module.css";

// Safety tab (D-066, D-067): gentle notes from the last 30 days (never the conversation, never a
// restricted event) and "Something felt wrong?" for the parent to report.
export default async function ChildSafety({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ report?: string }> }) {
  const { id } = await params;
  const { report } = await searchParams;
  const parent = await requireParentPage(`/children/${id}/safety`, { gate: "area", needHousehold: true });
  const [t, locale, o] = await Promise.all([getTranslations("parent"), getLocale(), childOverview(parent.householdId!, id)]);
  if (!o) notFound();
  const dateOf = (d: Date) => new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en", { day: "numeric", month: "long" }).format(d);

  return (
    <>
      <section className={styles.card} aria-labelledby="notes-title">
        <div className={styles.sectionHead}>
          <span className={styles.iconTile} data-tone="rose">
            <ShieldCheck size={20} aria-hidden />
          </span>
          <h2 id="notes-title" className={styles.sectionTitle}>{t("summariesTitle")}</h2>
        </div>
        {o.summaries.length === 0 ? <p className={styles.muted}>{t("summariesNone")}</p> : null}
        <ul className={styles.list} data-testid="summaries">
          {o.summaries.map((s) => (
            <li key={s.id} className={styles.listRow}>
              <span className={styles.listMain}>
                <span className={[styles.muted, styles.small].join(" ")}>{dateOf(s.at)}</span>
                <span>{t(`summary.${s.kind}` as "summary.steered")}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className={[styles.muted, styles.small].join(" ")}>
          {t("summariesNote")} <a href="/guide">{t("navGuide")}</a>
        </p>
      </section>

      <form action={createReportAction} className={styles.card} data-testid="report-form" aria-labelledby="report-title">
        <div className={styles.sectionHead}>
          <span className={styles.iconTile} data-tone="rose">
            <MessageSquareWarning size={20} aria-hidden />
          </span>
          <h2 id="report-title" className={styles.sectionTitle}>{t("reportTitle")}</h2>
        </div>
        <p className={styles.muted}>{t("reportIntro")}</p>
        {report === "sent" ? (
          <p className={styles.success} role="status">
            {t("reportSent")}
          </p>
        ) : null}
        {report === "error" ? (
          <p className={styles.error} role="alert">
            {t("reportError")}
          </p>
        ) : null}
        <input type="hidden" name="childId" value={id} />
        <label>
          <span className={styles.label}>{t("reportCategory")}</span>
          <select name="category" className={styles.select} defaultValue="upsetting" required>
            {PARENT_REPORT_CATEGORIES.map((c) => (
              <option key={c} value={c}>{t(`reportCategories.${c}` as "reportCategories.other")}</option>
            ))}
          </select>
        </label>
        <label>
          <span className={styles.label}>{t("reportNoteLabel")}</span>
          <textarea name="note" maxLength={500} rows={4} className={styles.textarea} aria-describedby="note-hint" />
          <span id="note-hint" className={styles.hint}>{t("reportNoteHint")}</span>
        </label>
        <div className={styles.actions}>
          <Button type="submit">{t("reportSend")}</Button>
        </div>
      </form>
    </>
  );
}
