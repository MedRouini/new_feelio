import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getParent } from "@/auth/guards";
import { pauseFor } from "@/child/usage";
import { decryptField } from "@/platform/crypto";
import { getChildInHousehold } from "@/parent/operations";
import styles from "../../parent.module.css";
import { ChildTabs } from "./ChildTabs";

// One child's area (D-067): name, a calm status, and four tabs. Each tab page checks the parent and
// the grown-up gate itself; this header only reads what that household may see.
export default async function ChildLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parent = await getParent();
  const child = parent?.householdId ? await getChildInHousehold(parent.householdId, id) : null;
  if (!child) notFound();
  const [t, ta, pause] = await Promise.all([getTranslations("parent"), getTranslations("ageBands"), pauseFor(id)]);
  const name = (child.nicknameEnc && decryptField(child.nicknameEnc)) || t("child");
  const status = pause?.reason === "outside_hours" ? { tone: "rest", text: t("statusResting") } : pause?.reason === "time_up" ? { tone: "rest", text: t("statusTimeUp") } : { tone: "ok", text: t("statusOk") };

  return (
    <div className={styles.stack}>
      <header className={styles.pageHead}>
        <div className={styles.pageHeadRow}>
          <div className={styles.stackTight}>
            <h1 className={styles.pageTitle}>{name}</h1>
            <p className={styles.muted}>{ta(child.ageBand)}</p>
          </div>
          <span className={styles.status} data-tone={status.tone} data-testid="child-status">
            {status.text}
          </span>
        </div>
      </header>
      <ChildTabs childId={id} labels={{ overview: t("tabOverview"), controls: t("tabControls"), stories: t("tabStories"), safety: t("tabSafety"), devices: t("tabDevices"), nav: t("tabsLabel") }} />
      <div className={styles.content}>{children}</div>
    </div>
  );
}
