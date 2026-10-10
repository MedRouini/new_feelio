import type { CSSProperties } from "react";
import { AssetImage } from "@/design/components/AssetImage";
import type { AvatarPose } from "@/design/asset-ids";
import type { Avatar as AvatarChoice } from "@/child/options";
import styles from "./ui.module.css";

/**
 * The child's own character (ONBOARDING.md §5, D-038): a composition of delivered images only, the
 * body variant for the chosen shape/colour/pose plus the chosen brand companion floating beside it.
 * The same component is used on the map, Talk, stories and in My collection.
 */
export function Avatar({
  avatar,
  pose = "idle",
  sizes,
  className,
  style,
  showCompanion = true,
}: {
  avatar: AvatarChoice;
  pose?: AvatarPose;
  sizes: string;
  className?: string;
  style?: CSSProperties;
  showCompanion?: boolean;
}) {
  return (
    <span
      className={[styles.avatar, className].filter(Boolean).join(" ")}
      style={style}
      data-avatar={`${avatar.shape}-${avatar.colour}-${avatar.companion}`}
    >
      <AssetImage id={`avatar_${avatar.shape}_${avatar.colour}_${pose}`} alt="" sizes={sizes} className={styles.avatarBody} />
      {showCompanion ? (
        <AssetImage id={`companion_${avatar.companion}`} alt="" sizes="12vmin" className={styles.avatarCompanion} />
      ) : null}
    </span>
  );
}
