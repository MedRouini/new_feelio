"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { Avatar } from "@/child/ui/Avatar";
import { Caption } from "@/child/ui/Caption";
import { Mascot } from "@/child/ui/Mascot";
import { NameSign } from "@/child/ui/NameSign";
import { play } from "@/child/ui/sound";
import { useCalm } from "@/child/ui/useCalm";
import uiStyles from "@/child/ui/ui.module.css";
import { AssetImage } from "@/design/components/AssetImage";
import { pick, pickOptional } from "@/design/asset-slots";
import type { AssetId } from "@/design/asset-ids";
import type { RoomState } from "@/child/room";
import layout from "@/content/room/layout.json";
import { MAX_INTERESTS } from "@/child/options";
import { LikesPicker } from "../hello/LikesPicker";
import { NamePicker, nameChoices } from "../hello/NamePicker";
import { CloseUp } from "./CloseUp";
import { GiftBox } from "./GiftBox";
import { saveRoom } from "./save";
import { Wardrobe } from "./Wardrobe";
import { FeelingsJar } from "./FeelingsJar";
import { StarShelf } from "./StarShelf";
import styles from "./room.module.css";

export type RoomObject = "wardrobe" | "gift" | "shelf" | "jar" | "pinboard" | "books";
const ART: Record<RoomObject, AssetId> = { wardrobe: "room_wardrobe", gift: "room_gift_box", shelf: "room_star_shelf", jar: "room_feelings_jar", pinboard: "room_pinboard", books: "room_book_stack" };
type Pos = { x: number; y: number; w: number };
const LAND = layout.land.objects as Record<RoomObject, Pos>;
/** Fixed room lines with pre-generated voice (room_<key>.mp3, D-037); other lines are captions only. */
const LINE_AUDIO = ["intro", "surprise", "locked", "steps1", "steps2", "steps3", "allOpen"] as const;

/**
 * My room (D-074): the child's bedroom. Their character in the middle wears its items; the objects
 * around it grow into close-ups. Positions come from content/room/layout.json (measured from the art).
 */
export function Room({ initial, storiesOn }: { initial: RoomState; storiesOn: boolean }) {
  const t = useTranslations("child.room");
  const tOnb = useTranslations("child.onb");
  const ti = useTranslations("interests");
  const locale = useLocale() === "ar" ? "ar" : "en";
  const rtl = locale === "ar";
  const calm = useCalm();
  const [state, setState] = useState(initial);
  const [open, setOpen] = useState<RoomObject | "name" | null>(null);
  const [line, setLine] = useState(initial.reached > initial.seen ? t("surprise") : t("intro"));
  const [hop, setHop] = useState(0);
  const sceneLand = pickOptional(["scene_my_room_land"] as const) ?? "scene_treasure_room_land";
  const scenePort = pickOptional(["scene_my_room_port"] as const) ?? "scene_treasure_room_port";
  const objects: RoomObject[] = ["wardrobe", "pinboard", "shelf", "jar", "gift", ...(storiesOn ? (["books"] as const) : [])];
  const giftReady = state.reached > state.seen;
  const c = layout.land.character;
  const cp = layout.port.character;
  const close = () => setOpen(null);
  const lineKey = LINE_AUDIO.find((k) => t(k) === line);

  const object = (id: RoomObject) => {
    const p = LAND[id];
    const inner = (
      <>
        <AssetImage id={ART[id]} alt="" sizes="(orientation: portrait) 22vw, 14vw" className={styles.objectArt} />
        <span className={styles.objectWord}>{t(`objects.${id}`)}</span>
      </>
    );
    const common = {
      className: styles.object,
      style: { ["--x" as string]: p.x, ["--y" as string]: p.y, ["--w" as string]: p.w },
      "data-object": id,
      "data-glow": id === "gift" && giftReady ? true : undefined,
      "data-room-part": true,
      "data-testid": `room-${id}`,
    };
    if (id === "books")
      return (
        <motion.a key={id} href="/stories" layoutId={calm ? undefined : "room-books"} {...common} onClick={() => play("tap")}>
          {inner}
          <span className={styles.count}>{state.books}</span>
        </motion.a>
      );
    return (
      <motion.button
        key={id}
        type="button"
        layoutId={calm ? undefined : `room-${id}`}
        {...common}
        onClick={() => {
          play("tap");
          if (id === "gift" && !giftReady) {
            const n = state.stepsToNext;
            setLine(n === null ? t("allOpen") : n === 1 ? t("steps1") : n === 2 ? t("steps2") : n === 3 ? t("steps3") : t("steps", { n }));
          }
          setOpen(id);
        }}
        aria-label={t(`objects.${id}`)}
      >
        {inner}
      </motion.button>
    );
  };

  return (
    <div className={styles.room} data-testid="room">
      {(["land", "port"] as const).map((o) => (
        <div key={o} className={uiStyles.sceneBg} data-orient={o} aria-hidden>
          <AssetImage id={o === "land" ? sceneLand : scenePort} alt="" sizes="100vw" className={uiStyles.sceneImg} priority />
        </div>
      ))}
      <Caption
        text={line}
        audioKey={lineKey ? `room_${lineKey}` : undefined}
        locale={locale}
        replayLabel={tOnb("replay")}
        variant="title"
        className={styles.say}
        testId="room-line"
      />

      <LayoutGroup>
        <div
          className={styles.me}
          style={{ ["--x" as string]: c.x, ["--y" as string]: c.y, ["--w" as string]: c.w, ["--px" as string]: cp.x, ["--py" as string]: cp.y, ["--pw" as string]: cp.w }}
          data-room-part
        >
          <button
            type="button"
            className={styles.character}
            onClick={() => {
              play("pick");
              setHop((h) => h + 1);
            }}
            aria-label={state.name ?? tOnb("aiSign")}
            data-testid="room-character"
          >
            <motion.span key={hop} className={styles.characterInner} animate={calm || !hop ? undefined : { y: [0, -28, 0] }} transition={{ duration: 0.5, ease: "easeOut" }}>
              <Avatar avatar={state.avatar} sizes="(orientation: portrait) 44vw, 22vw" />
            </motion.span>
          </button>
          <motion.button
            type="button"
            className={styles.nameButton}
            layoutId={calm ? undefined : "room-name"}
            onClick={() => {
              play("tap");
              setOpen("name");
            }}
            aria-label={t("nameAsk")}
            data-testid="room-name"
          >
            {state.name ? <NameSign text={state.name} className={styles.name} /> : <span className={styles.nameEmpty}>{t("nameAsk")}</span>}
          </motion.button>
        </div>
        <Mascot pose={pick(["mascot_holding_album", "mascot_happy"] as const)} label={tOnb("aiSign")} sizes="12vmin" className={styles.feelio} />

        <div className={styles.objects}>{objects.map(object)}</div>

        <AnimatePresence>
          {open === "shelf" ? (
            <CloseUp key="shelf" id="shelf" title={t("objects.shelf")} backLabel={t("back")} rtl={rtl} onClose={close}>
              <StarShelf places={state.places} locale={locale} />
            </CloseUp>
          ) : null}
          {open === "jar" ? (
            <CloseUp key="jar" id="jar" title={t("objects.jar")} backLabel={t("back")} rtl={rtl} onClose={close}>
              <FeelingsJar feelings={state.feelings} locale={locale} onSay={setLine} />
            </CloseUp>
          ) : null}
          {open === "wardrobe" ? (
            <CloseUp key="wardrobe" id="wardrobe" title={t("objects.wardrobe")} backLabel={t("back")} rtl={rtl} onClose={close}>
              <Wardrobe
                avatar={state.avatar}
                reached={state.reached}
                locale={locale}
                onLocked={() => setLine(t("locked"))}
                onWear={(slot, item) => {
                  const wear = { ...(state.avatar.wear ?? {}) };
                  if (item) wear[slot] = item;
                  else delete wear[slot];
                  setState((s) => ({ ...s, avatar: { ...s.avatar, wear } }));
                  void saveRoom({ action: "wear", slot, item });
                }}
                onColour={(colour) => {
                  setState((s) => ({ ...s, avatar: { ...s.avatar, colour } }));
                  void saveRoom({ action: "colour", colour });
                }}
              />
            </CloseUp>
          ) : null}
          {open === "gift" ? (
            <CloseUp key="gift" id="gift" title={t("objects.gift")} backLabel={t("back")} rtl={rtl} onClose={close}>
              <GiftBox
                ready={giftReady}
                stepsToNext={state.stepsToNext}
                locale={locale}
                onSay={setLine}
                onOpen={async () => {
                  const r = await saveRoom({ action: "seen" });
                  if (!r.ok || !r.opened) return null;
                  setState((s) => ({ ...s, seen: s.seen + 1 }));
                  return r.opened;
                }}
              />
            </CloseUp>
          ) : null}
          {open === "pinboard" ? (
            <CloseUp key="pinboard" id="pinboard" title={t("objects.pinboard")} backLabel={t("back")} rtl={rtl} onClose={close}>
              <div className={styles.likes}>
                <LikesPicker
                  likes={state.interests}
                  rtl={rtl}
                  burst={0}
                  onCentre={(id) => setLine(ti(id))}
                  onToggle={(id) => {
                    const has = state.interests.includes(id);
                    if (!has && state.interests.length >= MAX_INTERESTS) return setLine(tOnb("likesFull"));
                    play(has ? "tap" : "pick");
                    const interests = has ? state.interests.filter((x) => x !== id) : [...state.interests, id];
                    setState((s) => ({ ...s, interests }));
                    void saveRoom({ action: "interests", interests });
                  }}
                />
              </div>
            </CloseUp>
          ) : null}
          {open === "name" ? (
            <CloseUp key="name" id="name" title={t("nameAsk")} backLabel={t("back")} rtl={rtl} onClose={close}>
              <div className={styles.names}>
                <NamePicker
                  names={nameChoices(locale, state.parentNickname)}
                  pickedKey={state.nicknameKey}
                  label={t("nameAsk")}
                  onPick={(n) => {
                    play("pick");
                    setState((s) => ({ ...s, nicknameKey: n.key, name: n.word }));
                    setLine(tOnb("nameHello", { name: n.word }));
                    void saveRoom({ action: "nickname", nickname: n.key });
                  }}
                />
              </div>
            </CloseUp>
          ) : null}
        </AnimatePresence>
      </LayoutGroup>
    </div>
  );
}
