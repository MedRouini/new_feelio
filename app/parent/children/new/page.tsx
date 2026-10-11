import { getTranslations } from "next-intl/server";
import { Button } from "@/design/components/Button";
import { Field } from "@/design/components/Field";
import { createChildAction } from "../../actions";
import { requireParentPage } from "../../page-guard";
import styles from "../../parent.module.css";

export default async function NewChild({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireParentPage("/children/new", { gate: "area", needHousehold: true });
  const { error } = await searchParams;
  const [t, tc, ta] = await Promise.all([getTranslations("parent"), getTranslations("common"), getTranslations("ageBands")]);
  return (
    <div className={[styles.card, styles.panel].join(" ")}>
      <form action={createChildAction} className={styles.stack}>
        <h1 className={styles.pageTitle}>{t("addChild")}</h1>
        {error ? <p className={styles.error} role="alert">{tc("error")}</p> : null}
        <Field label={t("nickname")} hint={t("nicknameHint")} name="nickname" maxLength={30} autoComplete="off" />
        <div>
          <label className={styles.label} htmlFor="ageBand">{t("ageBand")}</label>
          <select id="ageBand" name="ageBand" className={styles.select} required defaultValue="7-9">
            {(["5-6", "7-9", "10-12"] as const).map((b) => (
              <option key={b} value={b}>{ta(b)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={styles.label} htmlFor="locale">{t("childLanguage")}</label>
          <select id="locale" name="locale" className={styles.select} required defaultValue="en">
            <option value="en">{tc("english")}</option>
            <option value="ar">{tc("arabic")}</option>
          </select>
        </div>
        <Button type="submit">{t("create")}</Button>
      </form>
    </div>
  );
}
