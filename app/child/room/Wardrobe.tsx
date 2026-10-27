"use client";

import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "motion/react";
import { Lock } from "lucide-react";
import { Avatar } from "@/child/ui/Avatar";
import { play } from "@/child/ui/sound";
import { useCalm } from "@/child/ui/useCalm";
import { AssetImage } from "@/design/components/AssetImage";
import { AVATAR_COLOURS } from "@/design/asset-ids";
import { WEAR_ITEMS, WEAR_SLOTS, type WearSlot } from "@/child/wardrobe";
import type { Avatar as AvatarChoice } from "@/child/options";
import styles from "./room.module.css";

/** Dress-up: the character large on the start side, a rail per body area on the end side. */
export function Wardrobe({
  avatar,
  reached,
  locale,
  onWear,
  onColour,
  onLocked,
}: {
  avatar: AvatarChoice;
  reached: number;
  locale: "en" | "ar";
  onWear: (slot: WearSlot, item: string | null) => void;
  onColour: (c: (typeof AVATAR_COLOURS)[number]) => void;
  onLocked: () => void;
}) {
  const t = useTranslations("child.room");
  const tc = useTranslations("colours");
  const calm = useCalm();
  const worn = avatar.wear ?? {};
  const key = JSON.stringify(worn) + avatar.colour;
  return (
    <div className={styles.wardrobe}>
      <div className={styles.mirror}>
        <AnimatePresence mode="popLayout">
          <motion.span key={key} className={styles.mirrorMe} initial={calm ? { opacity: 0 } : { scale: 0.92 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 420, damping: 18 }}>
            <Avatar avatar={avatar} sizes="(orientation: portrait) 50vw, 30vw" />
          </motion.span>
        </AnimatePresence>
      </div>
      <div className={styles.rails}>
        {WEAR_SLOTS.map((slot) => (
          <section key={slot} className={styles.rail} aria-label={t(`slots.${slot}`)}>
            <h3 className={styles.railName}>{t(`slots.${slot}`)}</h3>
            <ul className={styles.tiles}>
              {WEAR_ITEMS.filter((i) => i.slot === slot).map((i) => {
                const locked = WEAR_ITEMS.indexOf(i) >= reached;
                const on = worn[slot] === i.id;
                return (
                  <li key={i.id}>
                    <button
                      type="button"
                      className={styles.tile}
                      data-locked={locked || undefined}
                      aria-pressed={on}
                      aria-label={`${i[locale]}: ${locked ? t("locked") : on ? t("wearOff") : t("wearOn")}`}
                      onClick={() => {
                        if (locked) return onLocked();
                        play(on ? "tap" : "pick");
                        onWear(slot, on ? null : i.id);
                      }}
                      data-testid={`wear-${i.id}`}
                    >
                      <AssetImage id={i.asset} alt="" sizes="96px" className={styles.tileArt} />
                      {locked ? <Lock className={styles.tileLock} size={26} strokeWidth={3} aria-hidden /> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
        <section className={styles.rail} aria-label={t("colours")}>
          <h3 className={styles.railName}>{t("colours")}</h3>
          <ul className={styles.tiles}>
            {AVATAR_COLOURS.map((c) => (
              <li key={c}>
                <button
                  type="button"
                  className={styles.tile}
                  aria-pressed={avatar.colour === c}
                  aria-label={tc(c)}
                  onClick={() => {
                    play("pick");
                    onColour(c);
                  }}
                  data-testid={`colour-${c}`}
                >
                  <AssetImage id={`avatar_bun_${c}_idle`} alt="" sizes="96px" className={styles.tileArt} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
