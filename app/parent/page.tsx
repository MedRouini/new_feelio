import { getLocale, getTranslations } from "next-intl/server";
import { ChevronRight, ChevronLeft, Plus } from "lucide-react";
import { pauseFor, weekUsage } from "@/child/usage";
import { listChildren } from "@/parent/operations";
import { requireParentPage } from "./page-guard";
import styles from "./parent.module.css";

// Home (D-067): each child at a glance (today's minutes and whether they can play now), one tap away
// from their own area. An empty home is an invitation to add the first child.
export default async function ParentHome() {
  const parent = await requireParentPage("/", { gate: "area", needHousehold: true });
  const [t, ta, locale] = await Promise.all([getTranslations("parent"), getTranslations("ageBands"), getLocale()]);
  const n = (v: number) => new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en").format(v);
  const Chevron = locale === "ar" ? ChevronLeft : ChevronRight;
  const kids = await Promise.all(
    (await listChildren(parent.householdId!)).map(async (c) => {
      const [week, pause] = await Promise.all([weekUsage(c.id), pauseFor(c.id)]);
      return { ...c, today: week.at(-1)!.minutes, pause };
    }),
  );

  return (
    <>
      <header className={styles.pageHead}>
        <h1 className={styles.pageTitle}>{t("childrenTitle")}</h1>
        <p className={styles.pageLead}>{kids.length ? t("homeLead") : t("noChildren")}</p>
      </header>

      {kids.length ? (
        <ul className={[styles.list, styles.stack].join(" ")}>
          {kids.map((c) => (
            <li key={c.id}>
              <a className={styles.childCard} href={`/children/${c.id}`}>
                <span className={styles.stackTight}>
                  <span className={styles.childName}>{c.nickname ?? t("child")}</span>
                  <span className={styles.muted}>
                    {ta(c.ageBand)} · {t("todayShort", { n: n(c.today) })}
                  </span>
                </span>
                <span className={styles.actions}>
                  <span className={styles.status} data-tone={c.pause ? "rest" : "ok"}>
                    {c.pause?.reason === "outside_hours" ? t("statusResting") : c.pause ? t("statusTimeUp") : t("statusOk")}
                  </span>
                  <Chevron size={20} aria-hidden />
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : null}

      <div className={styles.actions}>
        <a className={styles.primaryLink} href="/children/new">
          <Plus size={18} aria-hidden />
          {t("addChild")}
        </a>
      </div>
    </>
  );
}
