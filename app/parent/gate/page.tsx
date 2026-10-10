import { getTranslations } from "next-intl/server";
import { getParent } from "@/auth/guards";
import { Button } from "@/design/components/Button";
import { Card } from "@/design/components/Card";
import { Field } from "@/design/components/Field";
import { gateAction } from "../actions";
import { dashboardRedirect as redirect } from "../page-guard";
import styles from "../parent.module.css";

// Adult gate: a password re-check (Better Auth verifyPassword), not a puzzle a child could solve.
export default async function Gate({ searchParams }: { searchParams: Promise<{ error?: string; next?: string; level?: string }> }) {
  const { error, next, level } = await searchParams;
  const parent = await getParent();
  if (!parent) redirect(`/sign-in?next=${encodeURIComponent(next ?? "/")}`);
  const t = await getTranslations("parent");
  return (
    <Card>
      <form action={gateAction} className={styles.stack}>
        <h1 className={styles.h1}>{t("gateTitle")}</h1>
        <p className={styles.muted}>{level === "sensitive" ? t("sensitiveGate") : t("gateBody")}</p>
        {error ? <p className={styles.error} role="alert">{t("gateWrong")}</p> : null}
        <input type="hidden" name="next" value={next ?? "/"} />
        <input type="hidden" name="level" value={level === "sensitive" ? "sensitive" : "area"} />
        <Field label={t("password")} name="password" type="password" autoComplete="current-password" required />
        <Button type="submit">{t("gateButton")}</Button>
      </form>
    </Card>
  );
}
