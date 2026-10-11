import { getTranslations } from "next-intl/server";
import { Globe } from "lucide-react";
import { Button } from "@/design/components/Button";
import { getHousehold } from "@/parent/operations";
import { supportedZones } from "@/platform/time";
import { deleteAccountAction, updateTimezoneAction } from "../actions";
import { requireParentPage } from "../page-guard";
import styles from "../parent.module.css";

// Account (D-065, D-067): the family's time zone, and deleting everything, set apart at the end.
export default async function Account({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const parent = await requireParentPage("/account", { gate: "area" });
  const { saved, error } = await searchParams;
  const t = await getTranslations("parent");
  const home = parent.householdId ? await getHousehold(parent.householdId) : null;
  return (
    <>
      <header className={styles.pageHead}>
        <h1 className={styles.pageTitle}>{t("navAccount")}</h1>
      </header>
      {home ? (
        <form action={updateTimezoneAction} className={styles.card} aria-labelledby="tz-title">
          <div className={styles.sectionHead}>
            <span className={styles.iconTile} data-tone="blue">
              <Globe size={20} aria-hidden />
            </span>
            <h2 id="tz-title" className={styles.sectionTitle}>{t("timezoneTitle")}</h2>
          </div>
          <p className={styles.muted}>{t("timezoneNote")}</p>
          {saved === "timezone" ? (
            <p className={styles.success} role="status">
              {t("timezoneSaved")}
            </p>
          ) : null}
          {error === "timezone" ? (
            <p className={styles.error} role="alert">
              {t("timezoneError")}
            </p>
          ) : null}
          <select name="timezone" className={styles.select} defaultValue={home.timezone} aria-label={t("timezoneTitle")} data-testid="timezone">
            {supportedZones().map((z) => (
              <option key={z} value={z}>{z.replace(/_/g, " ")}</option>
            ))}
          </select>
          <div className={styles.actions}>
            <Button type="submit">{t("saveTimezone")}</Button>
          </div>
        </form>
      ) : null}
      <form action={deleteAccountAction} className={styles.dangerZone}>
        <h2 className={styles.dangerTitle}>{t("deleteAccount")}</h2>
        <p className={styles.muted}>{t("deleteAccountConfirm")}</p>
        <div className={styles.actions}>
          <Button variant="quietDanger" type="submit">{t("deleteAccount")}</Button>
        </div>
      </form>
    </>
  );
}
