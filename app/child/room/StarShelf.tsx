"use client";

import { useTranslations } from "next-intl";
import { AssetImage } from "@/design/components/AssetImage";
import type { RoomState } from "@/child/room";
import styles from "./room.module.css";

/** The star shelf close-up: one star per finished level, grouped by place; unearned spots are outlines. */
export function StarShelf({ places, locale }: { places: RoomState["places"]; locale: "en" | "ar" }) {
  const t = useTranslations("child.room");
  const any = places.some((p) => p.levels.some((l) => l.done));
  return (
    <div className={styles.shelf}>
      {any ? null : <p className={styles.hint}>{t("shelfEmpty")}</p>}
      {places.map((p) => (
        <section key={p.id} className={styles.shelfRow} aria-label={p.name[locale]}>
          <h3 className={styles.shelfName}>{p.name[locale]}</h3>
          <ul className={styles.stars}>
            {p.levels.map((l, i) => (
              <li key={l.id} className={styles.star} data-on={l.done || undefined} aria-label={t("starLabel", { place: p.name[locale], n: i + 1 })} data-testid={l.done ? "star" : "star-spot"}>
                {l.done ? <AssetImage id="badge_star" alt="" sizes="64px" /> : null}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
