"use client";

import { usePathname } from "next/navigation";
import { BookOpen, LayoutDashboard, ShieldCheck, SlidersHorizontal, TabletSmartphone } from "lucide-react";
import styles from "../../parent.module.css";

/** A child's areas, so nothing is crammed onto one page (D-067; Stories added by D-070). */
export function ChildTabs({ childId, labels }: { childId: string; labels: { overview: string; controls: string; stories: string; safety: string; devices: string; nav: string } }) {
  const path = (usePathname() ?? "").replace(/^\/parent(?=\/|$)/, "");
  const base = `/children/${childId}`;
  const tabs = [
    { key: "overview", href: base, label: labels.overview, Icon: LayoutDashboard },
    { key: "controls", href: `${base}/settings`, label: labels.controls, Icon: SlidersHorizontal },
    { key: "stories", href: `${base}/stories`, label: labels.stories, Icon: BookOpen },
    { key: "safety", href: `${base}/safety`, label: labels.safety, Icon: ShieldCheck },
    { key: "devices", href: `${base}/devices`, label: labels.devices, Icon: TabletSmartphone },
  ];
  return (
    <nav className={styles.tabs} aria-label={labels.nav}>
      {tabs.map(({ key, href, label, Icon }) => (
        <a key={href} className={styles.tab} href={href} aria-current={path === href ? "page" : undefined} data-testid={`tab-${key}`}>
          <Icon size={18} aria-hidden />
          {label}
        </a>
      ))}
    </nav>
  );
}
