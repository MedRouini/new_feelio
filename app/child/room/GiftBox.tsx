"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "motion/react";
import { Gift } from "lucide-react";
import { useCalm } from "@/child/ui/useCalm";
import { play } from "@/child/ui/sound";
import { AssetImage } from "@/design/components/AssetImage";
import { itemById, POINTS_PER_ITEM } from "@/child/wardrobe";
import styles from "./room.module.css";

/** The gift box: how full it is (3 sparkles), and the unlock moment when a surprise is waiting. */
export function GiftBox({ ready, stepsToNext, locale, onOpen, onSay }: { ready: boolean; stepsToNext: number | null; locale: "en" | "ar"; onOpen: () => Promise<string | null>; onSay: (text: string) => void }) {
  const t = useTranslations("child.room");
  const calm = useCalm();
  const [busy, setBusy] = useState(false);
  const [opened, setOpened] = useState<string | null>(null);
  const filled = stepsToNext === null ? POINTS_PER_ITEM : POINTS_PER_ITEM - Math.min(POINTS_PER_ITEM, stepsToNext);
  const item = opened ? itemById(opened) : undefined;
  return (
    <div className={styles.gift}>
      <motion.div className={styles.giftBox} animate={ready && !calm ? { rotate: [0, -4, 4, 0] } : undefined} transition={{ duration: 0.8, repeat: ready && !calm ? Infinity : 0, repeatDelay: 1.2 }}>
        <AssetImage id="room_gift_box" alt="" sizes="40vmin" />
        <AnimatePresence>
          {item ? (
            <motion.span
              key={`${item.id}-${opened}`}
              className={styles.giftItem}
              initial={calm ? { opacity: 0 } : { y: 40, scale: 0.4, opacity: 0 }}
              animate={{ y: calm ? 0 : -60, scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 240, damping: 14 }}
            >
              <AssetImage id="ui_celebrate_burst" alt="" sizes="40vmin" className={styles.giftBurst} />
              <AssetImage id={item.asset} alt="" sizes="24vmin" className={styles.giftItemArt} />
            </motion.span>
          ) : null}
        </AnimatePresence>
      </motion.div>
      <ol className={styles.fill} aria-hidden>
        {Array.from({ length: POINTS_PER_ITEM }, (_, i) => (
          <li key={i} data-on={i < filled || undefined} />
        ))}
      </ol>
      {ready ? (
        <button
          type="button"
          className={styles.openIt}
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            play("whoosh");
            const id = await onOpen();
            setBusy(false);
            if (id) {
              setOpened(id);
              onSay(t("newItem", { item: itemById(id)![locale] }));
            }
          }}
          data-testid="gift-open"
        >
          <Gift size={34} strokeWidth={2.6} aria-hidden />
          <span>{t("open")}</span>
        </button>
      ) : null}
    </div>
  );
}
