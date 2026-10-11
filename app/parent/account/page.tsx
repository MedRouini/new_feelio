import { getTranslations } from "next-intl/server";
import { Button } from "@/design/components/Button";
import { Card } from "@/design/components/Card";
import { getHousehold } from "@/parent/operations";
import { supportedZones } from "@/platform/time";
import { deleteAccountAction, updateTimezoneAction } from "../actions";
import { requireParentPage } from "../page-guard";
import styles from "../parent.module.css";

export default async function Account({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const parent = await requireParentPage("/account", { gate: "area" });
  const { saved, error } = await searchParams;
  const t = await getTranslations("parent");
  const home = parent.householdId ? await getHousehold(parent.householdId) : null;
  return (
    <>
      {home ? (
        <Card>
          <form action={updateTimezoneAction} className={styles.stack}>
            <h1 className={styles.h1}>{t("timezoneTitle")}</h1>
            <p className={styles.muted}>{t("timezoneNote")}</p>
            {saved === "timezone" ? <p className={styles.notice} role="status">{t("timezoneSaved")}</p> : null}
            {error === "timezone" ? <p className={styles.error} role="alert">{t("timezoneError")}</p> : null}
            <select name="timezone" className={styles.select} defaultValue={home.timezone} aria-label={t("timezoneTitle")} data-testid="timezone">
              {supportedZones().map((z) => (
                <option key={z} value={z}>{z.replace(/_/g, " ")}</option>
              ))}
            </select>
            <Button type="submit">{t("saveTimezone")}</Button>
          </form>
        </Card>
      ) : null}
      <Card className={styles.danger}>
        <form action={deleteAccountAction} className={styles.stack}>
          <h2 className={styles.h1}>{t("deleteAccount")}</h2>
          <p>{t("deleteAccountConfirm")}</p>
          <Button variant="quietDanger" type="submit">{t("deleteAccount")}</Button>
        </form>
      </Card>
    </>
  );
}
