import { getLocale, getTranslations } from "next-intl/server";
import { Button } from "@/design/components/Button";
import { Card } from "@/design/components/Card";
import { env } from "@/platform/env";
import { getMarket } from "@/platform/markets";
import { consentAction } from "../actions";
import { BrowserTimezone } from "../BrowserTimezone";
import { dashboardRedirect as redirect, requireParentPage } from "../page-guard";
import styles from "../parent.module.css";

// Consent is recorded before any child data exists (SPEC §1). Draft text: needs legal review (CR-5).
export default async function Consent({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const parent = await requireParentPage("/consent", { gate: "area" });
  if (parent.householdId) redirect("/");
  const { error } = await searchParams;
  const [t, locale] = await Promise.all([getTranslations("parent"), getLocale()]);
  const market = getMarket(env().DEFAULT_MARKET);
  return (
    <Card>
      <form action={consentAction} className={styles.stack}>
        <h1 className={styles.h1}>{t("consentTitle")}</h1>
        <p className={styles.notice}>{t("consentPilot")}</p>
        <p>{t("consentIntro")}</p>
        <ul className={styles.scopes}>
          {market.consent.scopes.map((s) => (
            <li key={s}>{t(`consentScopes.${s}` as "consentScopes.child_profile")}</li>
          ))}
        </ul>
        <p>{t("consentRights")}</p>
        {error ? <p className={styles.error} role="alert">{t("consentCheckbox")}</p> : null}
        <label className={styles.check}>
          <input type="checkbox" name="agree" required />
          <span>{t("consentCheckbox")}</span>
        </label>
        <input type="hidden" name="locale" value={locale} />
        <BrowserTimezone />
        <Button type="submit">{t("consentButton")}</Button>
      </form>
    </Card>
  );
}
