"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { AssetImage } from "@/design/components/AssetImage";
import type { AssetId } from "@/design/assets";
import { play } from "./sound";
import styles from "./dock.module.css";

export type DockItem = "map" | "talk" | "stories" | "collection";

const ITEMS: { id: DockItem; href: string; art: AssetId }[] = [
  { id: "map", href: "/", art: "dock_map" },
  { id: "talk", href: "/talk", art: "dock_talk" },
  { id: "stories", href: "/stories", art: "dock_stories" },
  { id: "collection", href: "/collection", art: "dock_collection" },
];

/**
 * The phone-style dock (SPEC §4.1, D-054): app-style icons in one small rounded tray above the bottom
 * edge. Order follows the reading direction (it is a flex row, so Arabic starts at the right). Settings
 * and the parent area are never here; they sit behind the grown-up door.
 */
export function Dock({ active, stories = true }: { active: DockItem; stories?: boolean }) {
  const t = useTranslations("child.dock");
  return (
    <nav className={styles.dock} aria-label={t("nav")}>
      <div className={styles.tray}>
        {ITEMS.filter((item) => item.id !== "stories" || stories).map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={styles.item}
            aria-current={item.id === active ? "page" : undefined}
            onClick={() => play("tap")}
            data-testid={`dock-${item.id}`}
          >
            <span className={styles.art}>
              <AssetImage id={item.art} alt="" sizes="62px" />
            </span>
            <span className={styles.label}>{t(item.id)}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
