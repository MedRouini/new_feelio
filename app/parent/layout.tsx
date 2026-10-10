import { getLocale, getTranslations } from "next-intl/server";
import { getParent } from "@/auth/guards";
import { Button } from "@/design/components/Button";
import { setLocaleAction, signOutAction } from "./actions";
import styles from "./parent.module.css";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const [t, tc, locale, parent] = await Promise.all([getTranslations("parent"), getTranslations("common"), getLocale(), getParent()]);
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <p className={styles.brand}>{t("title")}</p>
        <div className={styles.headerActions}>
          <form action={setLocaleAction}>
            <input type="hidden" name="locale" value={locale === "ar" ? "en" : "ar"} />
            <input type="hidden" name="next" value="/" />
            <Button variant="secondary" type="submit" lang={locale === "ar" ? "en" : "ar"}>
              {locale === "ar" ? tc("english") : tc("arabic")}
            </Button>
          </form>
          {parent ? (
            <form action={signOutAction}>
              <Button variant="secondary" type="submit">{t("signOut")}</Button>
            </form>
          ) : null}
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
