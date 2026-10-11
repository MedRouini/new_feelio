import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { TabletSmartphone } from "lucide-react";
import { Button } from "@/design/components/Button";
import { Field } from "@/design/components/Field";
import { decryptField } from "@/platform/crypto";
import { getChildInHousehold, listDevices } from "@/parent/operations";
import { revokeDeviceAction } from "../../../actions";
import { requireParentPage } from "../../../page-guard";
import styles from "../../../parent.module.css";

// Devices tab (D-033, D-067): the tablets and phones this child uses, and handing a new one over
// (parent setup step 4). Removing a device signs the child out of it at once.
export default async function ChildDevices({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ setup?: string }> }) {
  const { id } = await params;
  const { setup } = await searchParams;
  const parent = await requireParentPage(`/children/${id}/devices`, { gate: "area", needHousehold: true });
  const child = await getChildInHousehold(parent.householdId!, id);
  if (!child) notFound();
  const [t, locale] = await Promise.all([getTranslations("parent"), getLocale()]);
  const name = (child.nicknameEnc && decryptField(child.nicknameEnc)) || t("child");
  const devices = (await listDevices({ userId: parent.userId, householdId: parent.householdId! })).filter((d) => d.meta.childId === child.id);
  const fmt = (d: Date | null) => (d ? new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en", { day: "numeric", month: "short", year: "numeric" }).format(d) : t("never"));

  return (
    <>
      <form method="post" action="/api/parent/devices" className={styles.card} aria-labelledby="setup-title">
        <div className={styles.sectionHead}>
          <span className={styles.iconTile} data-tone="blue">
            <TabletSmartphone size={20} aria-hidden />
          </span>
          <h2 id="setup-title" className={styles.sectionTitle}>{t("setUpTitle")}</h2>
        </div>
        {setup ? (
          <p className={styles.notice}>
            {t("stepOf", { n: 4 })}: {t("handOver", { name })}
          </p>
        ) : null}
        <p className={styles.muted}>{t("setUpHint")}</p>
        <input type="hidden" name="childId" value={child.id} />
        <Field label={t("deviceLabel")} name="label" maxLength={32} defaultValue="Tablet" />
        <div className={styles.actions}>
          <Button type="submit">{t("setUpThisDevice", { name })}</Button>
        </div>
      </form>

      <section className={styles.card} aria-labelledby="devices-title">
        <h2 id="devices-title" className={styles.sectionTitle}>{t("devicesTitle")}</h2>
        {devices.length === 0 ? <p className={styles.muted}>{t("noDevices")}</p> : null}
        <ul className={styles.list}>
          {devices.map((d) => (
            <li key={d.id} className={styles.listRow}>
              <span className={styles.listMain}>
                <span className={styles.listTitle}>{d.name}</span>
                <span className={[styles.muted, styles.small].join(" ")}>
                  {t("lastUsed")}: {fmt(d.lastRequest)} · {t("expires")}: {fmt(d.expiresAt)}
                </span>
              </span>
              <form action={revokeDeviceAction}>
                <input type="hidden" name="keyId" value={d.id} />
                <input type="hidden" name="next" value={`/children/${child.id}/devices`} />
                <Button variant="secondary" type="submit">{t("revoke")}</Button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
