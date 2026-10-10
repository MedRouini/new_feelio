"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { AssetImage } from "@/design/components/AssetImage";
import type { AssetId } from "@/design/assets";
import { play } from "./sound";
import styles from "./dock.module.css";

export type DockItem = "map" | "talk" | "stories" | "calm" | "collection";

type Entry = { id: DockItem; href: string; art: AssetId };

// D-055: the Map is the main button, always in the centre; two buttons on each side. The sides follow
// the reading direction (the grid flips in Arabic), so Talk is first on the reading side.
const START: Entry[] = [
  { id: "talk", href: "/talk", art: "dock_talk" },
  { id: "stories", href: "/stories", art: "dock_stories" },
];
const MAIN: Entry = { id: "map", href: "/", art: "dock_map" };
const END: Entry[] = [
  { id: "calm", href: "/calm", art: "dock_calm" },
  { id: "collection", href: "/collection", art: "dock_collection" },
];

/**
 * The phone-style dock (SPEC §4.1, D-054, D-055): a glass bar floating over the world, with the Map as
 * the larger centre button. Settings and the parent area are never here; they sit behind the grown-up
 * door. Stories is left out when a parent has switched it off (also enforced on the server).
 */
export function Dock({ active, stories = true }: { active: DockItem; stories?: boolean }) {
  const t = useTranslations("child.dock");
  const button = (item: Entry, main = false) => (
    <Link
      key={item.id}
      href={item.href}
      className={[styles.item, main ? styles.main : ""].join(" ")}
      aria-current={item.id === active ? "page" : undefined}
      onClick={() => play("tap")}
      data-testid={`dock-${item.id}`}
    >
      <span className={styles.art}>
        <AssetImage id={item.art} alt="" sizes={main ? "96px" : "72px"} />
      </span>
      <span className={styles.label}>{t(item.id)}</span>
    </Link>
  );
  return (
    <nav className={styles.dock} aria-label={t("nav")} data-dock>
      <div className={styles.tray}>
        <div className={styles.side} data-side="start">
          {START.filter((item) => item.id !== "stories" || stories).map((item) => button(item))}
        </div>
        {button(MAIN, true)}
        <div className={styles.side} data-side="end">
          {END.map((item) => button(item))}
        </div>
      </div>
    </nav>
  );
}
