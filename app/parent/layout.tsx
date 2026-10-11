import { getLocale, getTranslations } from "next-intl/server";
import { Menu } from "lucide-react";
import { adultGatePassed, getParent } from "@/auth/guards";
import { listChildren } from "@/parent/operations";
import { isSafetyLead } from "@/parent/safety-lead";
import { setLocaleAction, signOutAction } from "./actions";
import { ParentNav } from "./ParentNav";
import styles from "./parent.module.css";

// The parent dashboard shell (D-067). After the grown-up check: a sidebar with the real Feelio logo
// (brand/logotype, purple v1) and the sections. Before it (sign-in, sign-up, the check itself,
// consent): one calm centred card, and nothing about any child is shown.
export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const [t, tc, locale, parent] = await Promise.all([getTranslations("parent"), getTranslations("common"), getLocale(), getParent()]);
  const inside = parent?.householdId ? await adultGatePassed(parent.sessionId, "area") : false;

  const languageSwitch = (
    <form action={setLocaleAction}>
      <input type="hidden" name="locale" value={locale === "ar" ? "en" : "ar"} />
      <input type="hidden" name="next" value="/" />
      <button className={styles.linkButton} type="submit" lang={locale === "ar" ? "en" : "ar"}>
        {locale === "ar" ? tc("english") : tc("arabic")}
      </button>
    </form>
  );
  const logo = (cls: string) => (
    // eslint-disable-next-line @next/next/no-img-element -- the brand's own SVG, served as a static file
    <img src="/brand/feelio-logo.svg" alt={t("title")} className={cls} width={1722} height={539} />
  );

  if (!parent || !inside) {
    return (
      <div className={styles.authShell}>
        <div className={styles.authInner}>
          {logo(styles.authLogo)}
          <main className={styles.authCard}>{children}</main>
          <div className={styles.authFoot}>
            {languageSwitch}
            {parent ? (
              <form action={signOutAction}>
                <button className={styles.linkButton} type="submit">{t("signOut")}</button>
              </form>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  const kids = (await listChildren(parent.householdId!)).map((c) => ({ id: c.id, name: c.nickname ?? t("child") }));
  const labels = { home: t("navHome"), children: t("navChildren"), addChild: t("addChild"), guide: t("navGuide"), account: t("navAccount"), safety: t("navSafety"), nav: t("navLabel") };
  const nav = <ParentNav labels={labels} kids={kids} safetyLead={isSafetyLead(parent.userId)} />;
  const foot = (
    <div className={styles.sidebarFoot}>
      <div className={styles.footRow}>
        {languageSwitch}
        <form action={signOutAction}>
          <button className={styles.linkButton} type="submit">{t("signOut")}</button>
        </form>
      </div>
    </div>
  );

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <a href="/" className={styles.logoLink}>{logo(styles.logo)}</a>
        {nav}
        {foot}
      </aside>
      <details className={styles.mobileBar}>
        <summary>
          {logo(styles.logo)}
          <span className={styles.menuButton}>
            <Menu size={22} aria-hidden />
            {t("menu")}
          </span>
        </summary>
        <div className={styles.mobileMenu}>
          {nav}
          {foot}
        </div>
      </details>
      <main className={styles.main}>
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}
