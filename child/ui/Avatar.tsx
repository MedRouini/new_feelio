import type { CSSProperties } from "react";
import { AssetImage } from "@/design/components/AssetImage";
import { isDelivered } from "@/design/assets";
import type { Avatar as AvatarChoice } from "@/child/options";
import { wornLayers, type WearItem } from "@/child/wardrobe";
import styles from "./ui.module.css";

/**
 * The child's own character (ONBOARDING.md §5, D-038): a composition of delivered images only, the
 * picture for the chosen colour plus the chosen brand companion floating beside it. "Cheer" is a code
 * hop on the same picture (D-053: one character, one pose, to keep art for what matters).
 * The same component is used on the map, Talk, stories and in My room. The companion is hidden
 * by default since the companion step was removed (D-069); the data stays, for a later reward.
 * Worn items (My room, D-074) are separate delivered pictures placed by measured fractions of the
 * character box: back items behind the body, the rest in front. Items whose art isn't delivered yet
 * are left out (no grey box on the body).
 */
export function Avatar({
  avatar,
  cheer = false,
  sizes,
  className,
  style,
  showCompanion = false,
}: {
  avatar: AvatarChoice;
  cheer?: boolean;
  sizes: string;
  className?: string;
  style?: CSSProperties;
  showCompanion?: boolean;
}) {
  const { behind, front } = wornLayers(avatar.wear, isDelivered);
  const layer = (i: WearItem, back: boolean) => (
    <AssetImage
      key={i.id}
      id={i.asset}
      alt=""
      sizes={sizes}
      className={[styles.avatarWear, back ? styles.avatarBehind : ""].join(" ")}
      style={{ left: `${i.placement.x * 100}%`, top: `${i.placement.y * 100}%`, width: `${i.placement.w * 100}%`, maxWidth: "none", rotate: `${i.placement.rotate}deg` }}
    />
  );
  return (
    <span
      className={[styles.avatar, cheer ? styles.cheer : "", className].filter(Boolean).join(" ")}
      style={style}
      data-avatar={`${avatar.shape}-${avatar.colour}-${avatar.companion}`}
      data-wear={[...behind, ...front].map((i) => i.id).join(" ") || undefined}
    >
      {behind.map((i) => layer(i, true))}
      <AssetImage id={`avatar_${avatar.shape}_${avatar.colour}_idle`} alt="" sizes={sizes} className={styles.avatarBody} />
      {front.map((i) => layer(i, false))}
      {showCompanion ? (
        <AssetImage id={`companion_${avatar.companion}`} alt="" sizes="12vmin" className={styles.avatarCompanion} />
      ) : null}
    </span>
  );
}
