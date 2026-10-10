import { getTranslations } from "next-intl/server";
import { Button } from "@/design/components/Button";
import { Card } from "@/design/components/Card";
import { deleteAccountAction } from "../actions";
import { requireParentPage } from "../page-guard";
import styles from "../parent.module.css";

export default async function Account() {
  await requireParentPage("/account", { gate: "area" });
  const t = await getTranslations("parent");
  return (
    <Card className={styles.danger}>
      <form action={deleteAccountAction} className={styles.stack}>
        <h1 className={styles.h1}>{t("deleteAccount")}</h1>
        <p>{t("deleteAccountConfirm")}</p>
        <Button variant="quietDanger" type="submit">{t("deleteAccount")}</Button>
      </form>
    </Card>
  );
}
