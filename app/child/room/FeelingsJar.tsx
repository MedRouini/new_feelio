"use client";

import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { AssetImage } from "@/design/components/AssetImage";
import { pickOptional } from "@/design/asset-slots";
import type { AssetId } from "@/design/asset-ids";
import type { RoomState } from "@/child/room";
import { play } from "@/child/ui/sound";
import { useCalm } from "@/child/ui/useCalm";
import styles from "./room.module.css";

/** The feelings jar close-up: a glowing bubble for each feeling met in stories; tap one to hear its name. */
export function FeelingsJar({ feelings, locale, onSay }: { feelings: RoomState["feelings"]; locale: "en" | "ar"; onSay: (text: string) => void }) {
  const t = useTranslations("child.room");
  const calm = useCalm();
  const met = feelings.filter((f) => f.met);
  return (
    <div className={styles.jar}>
      {met.length ? null : <p className={styles.hint}>{t("jarEmpty")}</p>}
      <ul className={styles.bubbles}>
        {feelings.map((f, i) => {
          const face = pickOptional([`face_${f.id}`] as AssetId[]);
          return (
            <li key={f.id}>
              <motion.button
                type="button"
                className={styles.bubble}
                data-on={f.met || undefined}
                disabled={!f.met}
                onClick={() => {
                  play("pick");
                  onSay(f[locale]);
                }}
                animate={f.met && !calm ? { y: [0, -6, 0] } : undefined}
                transition={{ duration: 2.4 + (i % 3) * 0.4, repeat: Infinity, ease: "easeInOut" }}
                aria-label={f[locale]}
                data-testid={f.met ? "feeling-met" : "feeling-spot"}
              >
                {f.met && face ? <AssetImage id={face} alt="" sizes="88px" /> : null}
              </motion.button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
