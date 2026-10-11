import { getTranslations } from "next-intl/server";
import { Button } from "@/design/components/Button";
import { Field } from "@/design/components/Field";
import { signInAction } from "../actions";
import styles from "../parent.module.css";

export default async function SignIn({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const { error, next } = await searchParams;
  const t = await getTranslations("parent");
  return (
    <div className={[styles.card, styles.panel].join(" ")}>
      <form action={signInAction} className={styles.stack}>
        <h1 className={styles.pageTitle}>{t("signIn")}</h1>
        {error ? <p className={styles.error} role="alert">{t("badCredentials")}</p> : null}
        <input type="hidden" name="next" value={next ?? "/"} />
        <Field label={t("email")} name="email" type="email" autoComplete="email" required />
        <Field label={t("password")} name="password" type="password" autoComplete="current-password" required />
        <Button type="submit">{t("signIn")}</Button>
        <a href="/sign-up">{t("noAccount")}</a>
      </form>
    </div>
  );
}
