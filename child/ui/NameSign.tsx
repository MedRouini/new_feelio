import { AssetImage } from "@/design/components/AssetImage";
import styles from "./ui.module.css";

/** A wooden sign (delivered blank art) with words written by code: AI disclosure, names, places. */
export function NameSign({ text, className, testId }: { text: string; className?: string; testId?: string }) {
  return (
    <div className={[styles.sign, className].filter(Boolean).join(" ")} data-testid={testId}>
      <AssetImage id="ui_sign_plate" alt="" sizes="(orientation: portrait) 60vw, 420px" />
      <span className={styles.signText}>{text}</span>
    </div>
  );
}
