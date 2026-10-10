import type { CSSProperties } from "react";
import styles from "./components.module.css";

/**
 * Grey labelled box for a visual asset that has not been delivered yet (ASSET_PROTOCOL).
 * TODO(PLACEHOLDER): every undelivered id is listed in docs/PLACEHOLDERS.md; a milestone with open
 * placeholders is not done. The box keeps the requested shape so layouts don't jump when art arrives.
 * It is a <span> so it is valid anywhere an <img> is (inside buttons, paragraphs and links).
 */
export function Placeholder({
  assetId,
  ratio = 1,
  className,
  style,
  label,
}: {
  assetId: string;
  ratio?: number;
  className?: string;
  style?: CSSProperties;
  label?: string;
}) {
  return (
    <span
      className={[styles.placeholder, className].filter(Boolean).join(" ")}
      style={{ aspectRatio: String(ratio), ...style }}
      role="img"
      aria-label={label || `Missing asset ${assetId}`}
      data-placeholder={assetId}
    >
      <span>TODO(PLACEHOLDER)</span>
      <span>{assetId}</span>
    </span>
  );
}
