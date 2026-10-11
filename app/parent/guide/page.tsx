import { getTranslations } from "next-intl/server";
import { Card } from "@/design/components/Card";
import { requireParentPage } from "../page-guard";
import styles from "../parent.module.css";

// "How Feelio works" (SR-24, D-066): a plain safe-use guide for parents. It states, at policy level,
// what parents see and what they don't (SAFETY_POLICY §5 transparency). Not a legal or compliance text.
const SECTIONS = ["what", "not", "safe", "see", "exception", "controls", "tips"] as const;

export default async function Guide() {
  await requireParentPage("/guide", { gate: "area" });
  const t = await getTranslations("parent.guide");
  return (
    <Card>
      <article className={styles.stack} data-testid="guide">
        <h1 className={styles.h1}>{t("title")}</h1>
        <p className={styles.notice}>{t("pilot")}</p>
        {SECTIONS.map((s) => (
          <section key={s} className={styles.stack} aria-labelledby={`guide-${s}`}>
            <h2 id={`guide-${s}`} className={styles.h2}>{t(`${s}.title`)}</h2>
            <p>{t(`${s}.body`)}</p>
          </section>
        ))}
      </article>
    </Card>
  );
}
