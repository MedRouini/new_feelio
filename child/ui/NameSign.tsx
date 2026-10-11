import { AssetImage } from "@/design/components/AssetImage";
import styles from "./ui.module.css";

/**
 * A wooden sign (delivered blank art) with words written by code: AI disclosure, names, places.
 * The words sit in the board area measured from `ui_sign_plate` itself (board without its posts:
 * 22–67% of the height, 2–98% of the width; D-069) and are sized in container units, so they are
 * centred and contained at any sign size. Longer words get a smaller size and two balanced lines.
 */
export function NameSign({ text, className, testId }: { text: string; className?: string; testId?: string }) {
  const length = text.length <= 10 ? "short" : text.length <= 22 ? "mid" : "long";
  return (
    <div className={[styles.sign, className].filter(Boolean).join(" ")} data-testid={testId}>
      <AssetImage id="ui_sign_plate" alt="" sizes="(orientation: portrait) 60vw, 420px" />
      <span className={styles.signBoard}>
        <span className={styles.signText} data-length={length}>
          {text}
        </span>
      </span>
    </div>
  );
}
