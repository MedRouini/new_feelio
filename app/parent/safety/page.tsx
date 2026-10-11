import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { BarChart3, MessageSquareWarning, ShieldAlert } from "lucide-react";
import { Button } from "@/design/components/Button";
import { isSafetyLead, reviewQueue } from "@/parent/safety-lead";
import { reviewEventAction, reviewReportAction } from "../actions";
import { requireParentPage } from "../page-guard";
import styles from "../parent.module.css";

// The safety lead's review queue (SR-40, SAFETY_POLICY §5, docs/REPORTING_PROCEDURE.md, D-066).
// Only listed user ids, only after a fresh password check. Everyone else gets "not found".
export default async function SafetyReview() {
  const parent = await requireParentPage("/safety", { gate: "sensitive" });
  if (!isSafetyLead(parent.userId)) notFound();
  const [t, locale, q] = await Promise.all([getTranslations("parent.safety"), getLocale(), reviewQueue()]);
  const when = (d: Date) => new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en", { dateStyle: "medium", timeStyle: "short" }).format(d);

  return (
    <>
      <header className={styles.pageHead}>
        <h1 className={styles.pageTitle}>{t("title")}</h1>
        <p className={styles.pageLead}>{t("intro")}</p>
      </header>

      <section className={styles.card} aria-labelledby="events-title">
        <div className={styles.sectionHead}>
          <span className={styles.iconTile} data-tone="rose">
            <ShieldAlert size={20} aria-hidden />
          </span>
          <h2 id="events-title" className={styles.sectionTitle}>{t("eventsTitle", { n: q.events.length })}</h2>
        </div>
        {q.events.length === 0 ? <p className={styles.muted}>{t("none")}</p> : null}
        <ul className={styles.list} data-testid="review-events">
          {q.events.map((e) => (
            <li key={e.id} className={[styles.listRow, styles.stack].join(" ")} data-restricted={e.restricted || undefined}>
              <div className={styles.stackTight}>
                <span className={styles.listTitle}>{e.category}</span>
                <div className={styles.meta}>
                  <span className={styles.tag}>{t("level", { level: e.level, severity: e.severity })}</span>
                  <span className={styles.tag}>{e.feature}</span>
                  <span className={styles.tag}>{e.locale}</span>
                  {e.restricted ? (
                    <span className={styles.tag} data-tone="rose">
                      {t("restricted")}
                    </span>
                  ) : null}
                  {e.escalated ? (
                    <span className={styles.tag} data-tone="rose">
                      {t("escalated")}
                    </span>
                  ) : null}
                </div>
                <span className={[styles.muted, styles.small].join(" ")}>
                  {when(e.createdAt)} · {t("meta", { action: e.action, source: e.source, actor: e.actorClass ?? "n/a" })}
                </span>
              </div>
              {e.excerpt ? <blockquote className={styles.excerpt}>{e.excerpt}</blockquote> : <p className={[styles.muted, styles.small].join(" ")}>{t("noExcerpt")}</p>}
              <div className={styles.actions}>
                <form action={reviewEventAction}>
                  <input type="hidden" name="id" value={e.id} />
                  <Button variant="secondary" type="submit">{t("markReviewed")}</Button>
                </form>
                <form action={reviewEventAction}>
                  <input type="hidden" name="id" value={e.id} />
                  <input type="hidden" name="decision" value="escalate" />
                  <Button variant="quietDanger" type="submit">{t("escalate")}</Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.card} aria-labelledby="reports-title">
        <div className={styles.sectionHead}>
          <span className={styles.iconTile} data-tone="amber">
            <MessageSquareWarning size={20} aria-hidden />
          </span>
          <h2 id="reports-title" className={styles.sectionTitle}>{t("reportsTitle", { n: q.reports.length })}</h2>
        </div>
        {q.reports.length === 0 ? <p className={styles.muted}>{t("none")}</p> : null}
        <ul className={styles.list} data-testid="review-reports">
          {q.reports.map((r) => (
            <li key={r.id} className={[styles.listRow, styles.stack].join(" ")}>
              <div className={styles.stackTight}>
                <span className={styles.listTitle}>{r.category}</span>
                <span className={[styles.muted, styles.small].join(" ")}>{when(r.createdAt)}</span>
              </div>
              {r.note ? <blockquote className={styles.excerpt}>{r.note}</blockquote> : null}
              <form action={reviewReportAction}>
                <input type="hidden" name="id" value={r.id} />
                <Button variant="secondary" type="submit">{t("markReviewed")}</Button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.card} aria-labelledby="counts-title">
        <div className={styles.sectionHead}>
          <span className={styles.iconTile} data-tone="lilac">
            <BarChart3 size={20} aria-hidden />
          </span>
          <h2 id="counts-title" className={styles.sectionTitle}>{t("countsTitle")}</h2>
        </div>
        {q.counts.length === 0 ? <p className={styles.muted}>{t("none")}</p> : null}
        <table className={styles.table}>
          <tbody>
            {q.counts.map((c) => (
              <tr key={c.category}>
                <th scope="row">{c.category}</th>
                <td>{c.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className={[styles.muted, styles.small].join(" ")}>{t("procedure")}</p>
      </section>
    </>
  );
}
