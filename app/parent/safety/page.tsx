import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Button } from "@/design/components/Button";
import { Card } from "@/design/components/Card";
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
      <Card>
        <div className={styles.stack}>
          <h1 className={styles.h1}>{t("title")}</h1>
          <p className={styles.muted}>{t("intro")}</p>
        </div>
      </Card>

      <Card>
        <section className={styles.stack} aria-labelledby="events-title">
          <h2 id="events-title" className={styles.h1}>{t("eventsTitle", { n: q.events.length })}</h2>
          {q.events.length === 0 ? <p className={styles.muted}>{t("none")}</p> : null}
          <ul className={styles.list} data-testid="review-events">
            {q.events.map((e) => (
              <li key={e.id} className={styles.stack} data-restricted={e.restricted || undefined}>
                <p>
                  <strong>{e.category}</strong> · {t("level", { level: e.level, severity: e.severity })} · {e.feature} · {e.locale} · {when(e.createdAt)}
                </p>
                <p className={styles.muted}>
                  {t("meta", { action: e.action, source: e.source, actor: e.actorClass ?? "n/a" })}
                  {e.restricted ? <strong> · {t("restricted")}</strong> : null}
                  {e.escalated ? <strong> · {t("escalated")}</strong> : null}
                </p>
                {e.excerpt ? <blockquote className={styles.excerpt}>{e.excerpt}</blockquote> : <p className={styles.muted}>{t("noExcerpt")}</p>}
                <div className={styles.row}>
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
      </Card>

      <Card>
        <section className={styles.stack} aria-labelledby="reports-title">
          <h2 id="reports-title" className={styles.h1}>{t("reportsTitle", { n: q.reports.length })}</h2>
          {q.reports.length === 0 ? <p className={styles.muted}>{t("none")}</p> : null}
          <ul className={styles.list} data-testid="review-reports">
            {q.reports.map((r) => (
              <li key={r.id} className={styles.stack}>
                <p>
                  <strong>{r.category}</strong> · {when(r.createdAt)}
                </p>
                {r.note ? <blockquote className={styles.excerpt}>{r.note}</blockquote> : null}
                <form action={reviewReportAction}>
                  <input type="hidden" name="id" value={r.id} />
                  <Button variant="secondary" type="submit">{t("markReviewed")}</Button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      </Card>

      <Card>
        <section className={styles.stack} aria-labelledby="counts-title">
          <h2 id="counts-title" className={styles.h1}>{t("countsTitle")}</h2>
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
          <p className={styles.muted}>{t("procedure")}</p>
        </section>
      </Card>
    </>
  );
}
