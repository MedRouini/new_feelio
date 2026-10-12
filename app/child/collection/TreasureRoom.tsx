"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "motion/react";
import { Avatar } from "@/child/ui/Avatar";
import { Caption } from "@/child/ui/Caption";
import { Mascot } from "@/child/ui/Mascot";
import { NameSign } from "@/child/ui/NameSign";
import { useCalm } from "@/child/ui/useCalm";
import uiStyles from "@/child/ui/ui.module.css";
import { AssetImage } from "@/design/components/AssetImage";
import { pick, pickOptional } from "@/design/asset-slots";
import type { AssetId } from "@/design/asset-ids";
import type { Avatar as AvatarData } from "@/child/options";
import type { Collection } from "@/child/collection";
import styles from "./treasure.module.css";

type Page = "stars" | "books" | "feelings";
const TAB_ART: Record<Page, AssetId> = {
  stars: "badge_star",
  books: "dock_stories",
  feelings: "face_happy",
};

/**
 * My collection as a treasure room (redesign v2, D-071): the child's own character beside a sticker
 * album. Three pages, turned with the tabs: stars from the levels they finished, their own story books,
 * and the feelings they have met in stories. Empty spots are friendly outlines, never a "missing" state.
 */
export function TreasureRoom({
  data,
  avatar,
  name,
}: {
  data: Collection;
  avatar: AvatarData;
  name: string | null;
}) {
  const t = useTranslations("child.collection");
  const tOnb = useTranslations("child.onb");
  const locale = useLocale() === "ar" ? "ar" : "en";
  const calm = useCalm();
  const pages: Page[] = data.books
    ? ["stars", "books", "feelings"]
    : ["stars", "feelings"];
  const [page, setPage] = useState<Page>("stars");
  const [dir, setDir] = useState(1);
  const land = pickOptional(["scene_treasure_room_land"] as const);
  const port = pickOptional(["scene_treasure_room_port"] as const);
  const albumArt = pickOptional(["ui_sticker_album_open"] as const);

  const turn = (p: Page) => {
    setDir(pages.indexOf(p) > pages.indexOf(page) ? 1 : -1);
    setPage(p);
  };
  const stars = data.places
    .flatMap((p) => p.levels)
    .filter((l) => l.done).length;

  return (
    <div className={styles.room} data-testid="collection">
      {land && port ? (
        (["land", "port"] as const).map((o) => (
          <div key={o} className={uiStyles.sceneBg} data-orient={o} aria-hidden>
            <AssetImage
              id={o === "land" ? land : port}
              alt=""
              sizes="100vw"
              className={uiStyles.sceneImg}
              priority
            />
          </div>
        ))
      ) : (
        <div className={styles.vault} data-backdrop aria-hidden />
      )}

      <Caption
        text={t("intro")}
        audioKey="collection_intro"
        locale={locale}
        replayLabel={tOnb("replay")}
        variant="title"
        className={styles.say}
        testId="collection-line"
      />

      <div className={styles.me}>
        <Avatar
          avatar={avatar}
          cheer
          sizes="30vmin"
          className={styles.avatar}
        />
        {name ? (
          <NameSign text={name} className={styles.name} testId="child-name" />
        ) : null}
        <Mascot
          pose={pick(["mascot_holding_album", "mascot_happy"] as const)}
          label={tOnb("aiSign")}
          sizes="14vmin"
          className={styles.feelio}
        />
      </div>

      <div className={styles.album} data-art={albumArt ? true : undefined}>
        {albumArt ? (
          <AssetImage
            id={albumArt}
            alt=""
            sizes="60vw"
            className={styles.albumArt}
          />
        ) : null}
        <div className={styles.tabs} role="tablist" aria-label={t("title")}>
          {pages.map((p) => (
            <button
              key={p}
              type="button"
              role="tab"
              className={styles.tab}
              aria-selected={page === p}
              aria-label={t(`pages.${p}`)}
              onClick={() => turn(p)}
              data-testid={`album-${p}`}
            >
              <AssetImage
                id={TAB_ART[p]}
                alt=""
                sizes="56px"
                className={styles.tabArt}
              />
            </button>
          ))}
        </div>

        <div className={styles.spread}>
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            <motion.div
              key={page}
              role="tabpanel"
              aria-label={t(`pages.${page}`)}
              className={styles.page}
              initial={
                calm
                  ? { opacity: 0 }
                  : { rotateY: dir * (locale === "ar" ? 70 : -70), opacity: 0 }
              }
              animate={{ rotateY: 0, opacity: 1 }}
              exit={
                calm
                  ? { opacity: 0 }
                  : { rotateY: dir * (locale === "ar" ? -70 : 70), opacity: 0 }
              }
              transition={{ duration: calm ? 0.15 : 0.32, ease: "easeOut" }}
              data-testid={`page-${page}`}
            >
              <h2 className={styles.pageTitle}>{t(`pages.${page}`)}</h2>
              {page === "stars" ? (
                <>
                  {stars === 0 ? (
                    <p className={styles.hint}>{t("emptyStars")}</p>
                  ) : null}
                  <div className={styles.places}>
                    {data.places.map((p) => (
                      <section
                        key={p.id}
                        className={styles.row}
                        aria-label={p.name[locale]}
                      >
                        <h3 className={styles.rowName}>{p.name[locale]}</h3>
                        <ul className={styles.stickers}>
                          {p.levels.map((l) => (
                            <li
                              key={l.id}
                              className={styles.sticker}
                              data-on={l.done || undefined}
                              aria-label={l.title[locale]}
                              data-testid={l.done ? "star" : "star-spot"}
                            >
                              {l.done ? (
                                <AssetImage
                                  id="badge_star"
                                  alt=""
                                  sizes="64px"
                                  className={styles.stickerArt}
                                />
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      </section>
                    ))}
                  </div>
                </>
              ) : page === "books" ? (
                data.books?.length ? (
                  <ul className={styles.covers}>
                    {data.books.map((b, i) => (
                      <li key={b.id}>
                        <a
                          className={styles.cover}
                          href={`/stories/${b.id}`}
                          data-tone={i % 4}
                          data-testid="album-book"
                          style={{ rotate: `${((i * 7) % 9) - 4}deg` }}
                        >
                          {b.coverReady ? (
                            // eslint-disable-next-line @next/next/no-img-element -- the child's own picture, from private storage via our route
                            <img
                              src={`/api/child/stories/${b.id}/picture?n=0`}
                              alt=""
                              className={styles.coverImg}
                              loading="lazy"
                            />
                          ) : (
                            <AssetImage
                              id="companion_heart"
                              alt=""
                              sizes="64px"
                              className={styles.coverEmblem}
                            />
                          )}
                          <span className={styles.coverTitle}>{b.title}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.hint}>{t("emptyBooks")}</p>
                )
              ) : (
                <>
                  {data.feelings.some((f) => f.met) ? null : (
                    <p className={styles.hint}>{t("emptyFeelings")}</p>
                  )}
                  <ul className={styles.feelings}>
                    {data.feelings.map((f) => {
                      const face = pickOptional([`face_${f.id}`] as AssetId[]);
                      return (
                        <li
                          key={f.id}
                          className={styles.feeling}
                          data-on={f.met || undefined}
                          data-testid={f.met ? "feeling-met" : "feeling-spot"}
                        >
                          <span className={styles.feelingFace}>
                            {f.met && face ? (
                              <AssetImage id={face} alt="" sizes="72px" />
                            ) : null}
                          </span>
                          <span className={styles.feelingWord}>
                            {f[locale]}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
