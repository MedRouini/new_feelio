import { getTranslations } from "next-intl/server";
import { Card } from "@/design/components/Card";
import { listChildren } from "@/parent/operations";
import { requireParentPage } from "./page-guard";
import styles from "./parent.module.css";

export default async function ParentHome() {
  const parent = await requireParentPage("/", { gate: "area", needHousehold: true });
  const [t, ta] = await Promise.all([getTranslations("parent"), getTranslations("ageBands")]);
  const children = await listChildren(parent.householdId!);
  return (
    <>
      <Card>
        <div className={styles.stack}>
          <h1 className={styles.h1}>{t("childrenTitle")}</h1>
          {children.length === 0 ? <p className={styles.muted}>{t("noChildren")}</p> : null}
          <ul className={styles.list}>
            {children.map((c) => (
              <li key={c.id} className={styles.row}>
                <a href={`/children/${c.id}`}>{c.nickname ?? t("child")}</a>
                <span className={styles.muted}>{ta(c.ageBand)}</span>
              </li>
            ))}
          </ul>
          <a href="/children/new">{t("addChild")}</a>
        </div>
      </Card>
      <a href="/account" className={styles.muted}>{t("deleteAccount")}</a>
    </>
  );
}
