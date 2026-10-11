import { getTranslations } from "next-intl/server";
import { Ban, Eye, Heart as HeartIcon, Info, Lightbulb, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { requireParentPage } from "../page-guard";
import styles from "../parent.module.css";

// "How Feelio works" (SR-24, D-066): a plain safe-use guide for parents. It states, at policy level,
// what parents see and what they don't (SAFETY_POLICY §5 transparency). Not a legal or compliance text.
const SECTIONS = [
  { key: "what", Icon: HeartIcon, tone: "purple" },
  { key: "not", Icon: Ban, tone: "lilac" },
  { key: "safe", Icon: ShieldCheck, tone: "rose" },
  { key: "see", Icon: Eye, tone: "blue" },
  { key: "exception", Icon: Info, tone: "rose" },
  { key: "controls", Icon: SlidersHorizontal, tone: "amber" },
  { key: "tips", Icon: Lightbulb, tone: "amber" },
] as const;

export default async function Guide() {
  await requireParentPage("/guide", { gate: "area" });
  const t = await getTranslations("parent.guide");
  return (
    <article className={styles.stack} data-testid="guide">
      <header className={styles.pageHead}>
        <h1 className={styles.pageTitle}>{t("title")}</h1>
        <p className={styles.pageLead}>{t("pilot")}</p>
      </header>
      {SECTIONS.map(({ key, Icon, tone }) => (
        <section key={key} className={key === "exception" ? styles.calloutCard : styles.card} aria-labelledby={`guide-${key}`}>
          <div className={styles.sectionHead}>
            <span className={styles.iconTile} data-tone={tone}>
              <Icon size={20} aria-hidden />
            </span>
            <h2 id={`guide-${key}`} className={styles.sectionTitle}>{t(`${key}.title`)}</h2>
          </div>
          <p className={styles.proseText}>{t(`${key}.body`)}</p>
        </section>
      ))}
    </article>
  );
}
