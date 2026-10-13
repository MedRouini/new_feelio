"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "motion/react";
import { ActionObject } from "@/child/ui/ActionObject";
import { Caption } from "@/child/ui/Caption";
import { Mascot } from "@/child/ui/Mascot";
import { play } from "@/child/ui/sound";
import { useCalm } from "@/child/ui/useCalm";
import uiStyles from "@/child/ui/ui.module.css";
import { AssetImage } from "@/design/components/AssetImage";
import { pick, pickOptional } from "@/design/asset-slots";
import { STORY_ART } from "./art";
import styles from "./stories.module.css";

type Book = { id: string; title: string; coverReady: boolean; read: boolean };

/**
 * My library (D-070, D-071, D-075): the reading table with the big "make a new story" object and Feelio
 * reading beside it, and the child's books standing on wooden shelves. New books carry a ribbon; a tapped
 * book slides out before it opens. When a new story can't be made now, the object rests and Feelio says
 * why; the books still open.
 */
export function Shelf({ books, makeState, line, lineAudio }: { books: Book[]; makeState: "ready" | "resting"; line: string; lineAudio?: string }) {
  const t = useTranslations("child.stories");
  const tOnb = useTranslations("child.onb");
  const locale = useLocale() === "ar" ? "ar" : "en";
  const calm = useCalm();
  const [say, setSay] = useState(line);
  const [opening, setOpening] = useState<string | null>(null);

  /** The tapped book slides out of the shelf, then opens (at once when calm). */
  const open = (id: string) => {
    play("whoosh");
    const go = () => window.location.assign(`/stories/${id}`);
    if (calm) return go();
    setOpening(id);
    setTimeout(go, 220);
  };

  return (
    <div className={styles.shelfRoom}>
      <Library />
      <Caption text={say} audioKey={say === line ? lineAudio : undefined} locale={locale} replayLabel={tOnb("replay")} variant="title" className={styles.say} testId="shelf-line" />

      <div className={styles.library}>
        <section className={styles.table} aria-label={t("makeNew")}>
          <ActionObject
            art="ui_btn_make_story"
            label={t("makeNew")}
            href="/stories/make"
            resting={makeState === "resting"}
            onPress={() => setSay(line)}
            sizes="(orientation: portrait) 34vw, 20vw"
            className={styles.make}
            testId="make-story"
          />
          <Mascot pose={pick(books.length ? STORY_ART.reader : (["mascot_pointing", "mascot_happy"] as const))} label={tOnb("aiSign")} sizes="16vmin" className={styles.reader} />
        </section>

        <section className={styles.shelves} aria-label={t("myBooks")}>
          <h2 className={styles.shelvesTitle}>{t("myBooks")}</h2>
          <ul className={styles.books} data-empty={books.length ? undefined : true}>
            {books.length
              ? books.map((b, i) => (
                  <li key={b.id}>
                    <motion.a
                      className={styles.book}
                      href={`/stories/${b.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        open(b.id);
                      }}
                      animate={opening === b.id ? { y: -18, scale: 1.08 } : { y: 0, scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      aria-label={b.read ? b.title : `${b.title}, ${t("newBook")}`}
                      data-testid="book"
                    >
                      <span className={styles.cover} data-tone={i % 4}>
                        {b.coverReady ? (
                          // eslint-disable-next-line @next/next/no-img-element -- the child's own picture, from private storage via our route
                          <img src={`/api/child/stories/${b.id}/picture?n=0`} alt="" className={styles.coverImg} loading="lazy" />
                        ) : (
                          <AssetImage id="companion_heart" alt="" sizes="96px" className={styles.coverEmblem} />
                        )}
                        {!b.read ? <span className={styles.ribbon} aria-hidden data-testid="new-ribbon" /> : null}
                      </span>
                      <span className={styles.bookTitle}>{b.title}</span>
                    </motion.a>
                  </li>
                ))
              : [0, 1, 2].map((k) => <li key={k} className={styles.emptySpot} aria-hidden />)}
          </ul>
        </section>
      </div>
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
