import { getTranslations } from "next-intl/server";
import { Button } from "@/design/components/Button";
import { Card } from "@/design/components/Card";
import { Field } from "@/design/components/Field";
import { signUpAction } from "../actions";
import styles from "../parent.module.css";

export default async function SignUp({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const t = await getTranslations("parent");
  return (
    <Card>
      <form action={signUpAction} className={styles.stack}>
        <h1 className={styles.h1}>{t("signUp")}</h1>
        {error ? <p className={styles.error} role="alert">{t("signUpFailed")}</p> : null}
        <Field label={t("name")} name="name" autoComplete="name" required maxLength={80} />
        <Field label={t("email")} name="email" type="email" autoComplete="email" required />
        <Field label={t("password")} hint={t("passwordHint")} name="password" type="password" autoComplete="new-password" required minLength={10} />
        <label className={styles.check}>
          <input type="checkbox" name="ageConfirm" required />
          <span>{t("ageConfirm")}</span>
        </label>
        <Button type="submit">{t("signUp")}</Button>
        <a href="/sign-in">{t("haveAccount")}</a>
      </form>
    </Card>
  );
}
