import { getTranslations } from "next-intl/server";
import { getChild } from "@/auth/guards";
import { AiChip } from "@/design/components/AiChip";
import { AssetImage } from "@/design/components/AssetImage";
import { env } from "@/platform/env";
import styles from "./child.module.css";

// Child app home (Milestone 1). The interactive world map replaces the greeting in Milestone 1b.
export default async function ChildHome() {
  const child = await getChild();
  const t = await getTranslations("child");

  if (!child) {
    return (
      <main className={styles.screen}>
        <AiChip />
        <AssetImage id="mascot_waving" alt="" sizes="(orientation: portrait) 60vw, 34vh" className={styles.mascot} priority />
        <h1 className={styles.title}>{t("notSetUpTitle")}</h1>
        <p className={styles.body}>{t("notSetUpBody")}</p>
        <a className={styles.grownUpLink} href={`${env().DASHBOARD_ORIGIN}/`}>
          {t("askGrownUp")}
        </a>
      </main>
    );
  }

  return (
    <main className={styles.screen}>
      <AiChip />
      <AssetImage id="mascot_idle" alt="" sizes="(orientation: portrait) 60vw, 34vh" className={styles.mascot} priority />
      <h1 className={styles.title}>{t("homeHello")}</h1>
      <p className={styles.body}>{t("aiExplain")}</p>
      <p className={styles.note}>{t("homeComingSoon")}</p>
    </main>
  );
}
