import styles from "./components.module.css";

/**
 * Grey labelled box for a visual asset that has not been delivered yet (ASSET_PROTOCOL).
 * Every use must be listed in docs/PLACEHOLDERS.md. A milestone with open placeholders is not done.
 */
export function Placeholder({ assetId, width, height }: { assetId: string; width: number | string; height: number | string }) {
  return (
    <div className={styles.placeholder} style={{ inlineSize: width, blockSize: height }} role="img" aria-label={`Missing asset ${assetId}`}>
      TODO(PLACEHOLDER): asset {assetId}
    </div>
  );
}
