import { Check } from "lucide-react";
import { AssetImage } from "@/design/components/AssetImage";
import type { AssetId } from "@/design/asset-ids";
import styles from "./choiceDisc.module.css";

/** A choice on a round stage-light disc (D-075): its picture, or its word when there's no picture. */
export function ChoiceDisc({ art, word, selected, size = "md" }: { art?: AssetId | null; word: string; selected?: boolean; size?: "lg" | "md" | "sm" }) {
  return (
    <span className={styles.disc} data-size={size} data-selected={selected || undefined} data-word={art ? undefined : true}>
      {art ? <AssetImage id={art} alt="" sizes={size === "lg" ? "28vmin" : "16vmin"} className={styles.art} /> : <span className={styles.word}>{word}</span>}
      {selected ? (
        <span className={styles.check} aria-hidden>
          <Check size={22} strokeWidth={3.5} />
        </span>
      ) : null}
    </span>
  );
}
