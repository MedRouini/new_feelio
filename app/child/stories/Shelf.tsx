"use client";

import { useLocale, useTranslations } from "next-intl";
import { motion } from "motion/react";
import { WandSparkles } from "lucide-react";
import { Mascot } from "@/child/ui/Mascot";
import { Caption } from "@/child/ui/Caption";
import { useCalm } from "@/child/ui/useCalm";
import uiStyles from "@/child/ui/ui.module.css";
import { AssetImage } from "@/design/components/AssetImage";
import { pick, pickOptional } from "@/design/asset-slots";
import { STORY_ART } from "./art";
import styles from "./stories.module.css";

type Book = { id: string; title: string; coverReady: boolean; read: boolean };

/**
 * My library (D-070, redesign v2 D-071): the child's books standing on wooden shelves (their own
 * generated cover picture, or a brand cover with the heart companion while it is being painted), newest
 * first, Feelio reading on top, and the big magic button to make a new story with Feelio. The AI notice
 * lives in the story workshop, not here (owner decision 2026-10-12).
 */
export function Shelf({ books, canMake, line }: { books: Book[]; canMake: boolean; line: string }) {
  const t = useTranslations("child.stories");
  const tOnb = useTranslations("child.onb");
  const locale = useLocale() === "ar" ? "ar" : "en";
  const calm = useCalm();
  const wand = pickOptional(STORY_ART.wand);

  return (
    <div className={styles.shelfRoom}>
      <Library />

      <div className={styles.shelfHead}>
        <Mascot pose={pick(STORY_ART.reader)} label={tOnb("aiSign")} sizes="22vmin" className={styles.shelfMascot} />
        <Caption text={line} locale={locale} replayLabel={tOnb("replay")} variant="title" className={styles.shelfSay} testId="shelf-line" />
        {canMake ? (
          <a className={styles.magic} href="/stories/make" data-testid="make-story">
            {wand ? <AssetImage id={wand} alt="" sizes="64px" className={styles.magicArt} /> : <WandSparkles size={40} strokeWidth={2.4} aria-hidden />}
            <span>{t("make")}</span>
          </a>
        ) : null}
      </div>

      {books.length ? (
        <ul className={styles.books} aria-label={t("shelfLabel")}>
          {books.map((b, i) => (
            <motion.li key={b.id} initial={calm ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.05, type: "spring", stiffness: 260, damping: 24 }}>
              <a className={styles.book} href={`/stories/${b.id}`} data-testid="book">
                <span className={styles.cover} data-tone={i % 4}>
                  {b.coverReady ? (
                    // eslint-disable-next-line @next/next/no-img-element -- the child's own picture, from private storage via our route
                    <img src={`/api/child/stories/${b.id}/picture?n=0`} alt="" className={styles.coverImg} loading="lazy" />
                  ) : (
                    <AssetImage id="companion_heart" alt="" sizes="96px" className={styles.coverEmblem} />
                  )}
                  {!b.read ? <span className={styles.newBadge}>{t("newBook")}</span> : null}
                </span>
                <span className={styles.bookTitle}>{b.title}</span>
              </a>
            </motion.li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/**
 * The library behind the stories screens (redesign v2): its scene art when delivered, until then a warm
 * flat wall in brand colours. Never a blurred picture.
 */
export function Library() {
  const land = pickOptional(["scene_library_land"] as const);
  const port = pickOptional(["scene_library_port"] as const);
  if (land && port)
    return (
      <>
        {(["land", "port"] as const).map((o) => (
          <div key={o} className={uiStyles.sceneBg} data-orient={o} aria-hidden>
            <AssetImage id={o === "land" ? land : port} alt="" sizes="100vw" className={uiStyles.sceneImg} priority />
          </div>
        ))}
      </>
    );
  return <div className={styles.wall} data-backdrop aria-hidden />;
}
