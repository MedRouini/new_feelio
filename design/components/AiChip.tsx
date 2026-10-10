import { getTranslations } from "next-intl/server";
import { AssetImage } from "./AssetImage";
import styles from "./components.module.css";

/** Always-visible AI disclosure (CR-8, SR-20): "I'm Feelio, a friendly AI". */
export async function AiChip() {
  const t = await getTranslations("common");
  return (
    <p className={styles.aiChip}>
      <AssetImage id="mascot_head_happy" alt="" sizes="32px" className={styles.aiChipAvatar} />
      <span>{t("aiChip")}</span>
    </p>
  );
}
