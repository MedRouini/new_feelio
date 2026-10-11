"use client";

import { usePathname } from "next/navigation";
import { BookOpen, CircleUser, House, Plus, ShieldCheck } from "lucide-react";
import styles from "./parent.module.css";

export type NavLabels = { home: string; children: string; addChild: string; guide: string; account: string; safety: string; nav: string };

/** The dashboard's sections. Marks the current one (aria-current) with the logo's amber. */
export function ParentNav({ labels, kids, safetyLead }: { labels: NavLabels; kids: { id: string; name: string }[]; safetyLead: boolean }) {
  const path = usePathname() ?? "/";
  // Internal paths carry the /parent prefix (proxy rewrite); compare on the public path.
  const here = path.replace(/^\/parent(?=\/|$)/, "") || "/";
  const is = (href: string) => (href === "/" ? here === "/" : here === href || here.startsWith(`${href}/`));
  const current = (href: string) => (is(href) ? ("page" as const) : undefined);

  return (
    <nav className={styles.nav} aria-label={labels.nav}>
      <a className={styles.navItem} href="/" aria-current={current("/")}>
        <House className={styles.navIcon} aria-hidden />
        {labels.home}
      </a>
      {kids.length ? (
        <div className={styles.navGroup}>
          <p className={styles.navLabel}>{labels.children}</p>
          {kids.map((k) => (
            <a key={k.id} className={[styles.navItem, styles.navChild].join(" ")} href={`/children/${k.id}`} aria-current={current(`/children/${k.id}`)}>
              {k.name}
            </a>
          ))}
          <a className={[styles.navItem, styles.navChild, styles.navAdd].join(" ")} href="/children/new" aria-current={current("/children/new")}>
            <Plus className={styles.navIcon} aria-hidden />
            {labels.addChild}
          </a>
        </div>
      ) : null}
      <div className={styles.navSpacer} aria-hidden />
      <a className={styles.navItem} href="/guide" aria-current={current("/guide")}>
        <BookOpen className={styles.navIcon} aria-hidden />
        {labels.guide}
      </a>
      <a className={styles.navItem} href="/account" aria-current={current("/account")}>
        <CircleUser className={styles.navIcon} aria-hidden />
        {labels.account}
      </a>
      {safetyLead ? (
        <a className={styles.navItem} href="/safety" aria-current={current("/safety")}>
          <ShieldCheck className={styles.navIcon} aria-hidden />
          {labels.safety}
        </a>
      ) : null}
    </nav>
  );
}
