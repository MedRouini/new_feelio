import type { CSSProperties } from "react";
import { AssetImage } from "@/design/components/AssetImage";
import type { Avatar as AvatarChoice } from "@/child/options";
import styles from "./ui.module.css";

/**
 * The child's own character (ONBOARDING.md §5, D-038): a composition of delivered images only, the
 * picture for the chosen colour plus the chosen brand companion floating beside it. "Cheer" is a code
 * hop on the same picture (D-053: one character, one pose, to keep art for what matters).
 * The same component is used on the map, Talk, stories and in My collection.
 */
export function Avatar({
  avatar,
  cheer = false,
  sizes,
  className,
  style,
  showCompanion = true,
}: {
  avatar: AvatarChoice;
  cheer?: boolean;
  sizes: string;
  className?: string;
  style?: CSSProperties;
  showCompanion?: boolean;
}) {
  return (
    <span
      className={[styles.avatar, cheer ? styles.cheer : "", className].filter(Boolean).join(" ")}
      style={style}
      data-avatar={`${avatar.shape}-${avatar.colour}-${avatar.companion}`}
    >
      <AssetImage id={`avatar_${avatar.shape}_${avatar.colour}_idle`} alt="" sizes={sizes} className={styles.avatarBody} />
      {showCompanion ? (
        <AssetImage id={`companion_${avatar.companion}`} alt="" sizes="12vmin" className={styles.avatarCompanion} />
      ) : null}
    </span>
  );
}
