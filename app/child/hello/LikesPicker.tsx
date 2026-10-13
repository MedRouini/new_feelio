"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "motion/react";
import { Heart, X } from "lucide-react";
import { useCalm } from "@/child/ui/useCalm";
import { INTERESTS, MAX_INTERESTS, type Interest } from "@/child/options";
import { AssetImage } from "@/design/components/AssetImage";
import type { AssetId } from "@/design/asset-ids";
import { Carousel } from "./Carousel";
import { Sparkles } from "./Sparkles";
import styles from "./onboarding.module.css";

/** "What do you like?" (onboarding and My room): a carousel of likes, a like toggle and up to 3 picks. */
export function LikesPicker({ likes, onToggle, onCentre, rtl, burst }: { likes: Interest[]; onToggle: (id: Interest) => void; onCentre?: (id: Interest) => void; rtl: boolean; burst: number }) {
  const t = useTranslations("child.onb");
  const ti = useTranslations("interests");
  const reduce = useCalm();
  const [index, setIndex] = useState(0);
  const centre = INTERESTS[index];
  const liked = likes.includes(centre);
  return (
    <>
      <Carousel
        items={INTERESTS}
        index={index}
        onIndex={(i) => {
          setIndex(i);
          onCentre?.(INTERESTS[i]);
        }}
        rtl={rtl}
        spacing={0.3}
        reach={2}
        label={t("likesLabel")}
        itemLabel={(id) => `${ti(id)}${likes.includes(id) ? ` (${t("picked")})` : ""}`}
        prevLabel={t("prevOne")}
        nextLabel={t("nextOne")}
        testId="likes-picker"
        render={(id, isCentre) => (
          <span className={styles.likeSlide} data-liked={likes.includes(id) || undefined}>
            <AssetImage id={`like_${id}` as AssetId} alt="" sizes="30vmin" className={[styles.likeArt, isCentre ? styles[`idle_${id}`] : ""].join(" ")} />
            {likes.includes(id) ? (
              <span className={styles.likedMark} aria-hidden>
                <Heart size={26} fill="currentColor" />
              </span>
            ) : null}
            {isCentre ? <Sparkles burst={liked ? burst : 0} /> : null}
          </span>
        )}
      />
      <div className={styles.likeRow}>
        <button type="button" className={styles.likeButton} aria-pressed={liked} onClick={() => onToggle(centre)} data-testid="like-toggle">
          {liked ? <X size={30} strokeWidth={3} aria-hidden /> : <Heart size={30} strokeWidth={3} aria-hidden />}
          <span>{liked ? t("notThisOne") : t("likeIt")}</span>
        </button>
        <ul className={styles.slots} aria-label={t("yourPicks")}>
          {Array.from({ length: MAX_INTERESTS }, (_, i) => likes[i]).map((id, i) => (
            <li key={i}>
              <AnimatePresence mode="popLayout">
                {id ? (
                  <motion.button
                    key={id}
                    type="button"
                    className={styles.slotItem}
                    aria-label={`${ti(id)}: ${t("notThisOne")}`}
                    onClick={() => onToggle(id)}
                    initial={reduce ? { opacity: 0 } : { scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 380, damping: 18 }}
                    data-testid={`picked-${id}`}
                  >
                    <AssetImage id={`like_${id}` as AssetId} alt="" sizes="80px" />
                  </motion.button>
                ) : null}
              </AnimatePresence>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
