import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Button } from "@/design/components/Button";
import { Card } from "@/design/components/Card";
import { Field } from "@/design/components/Field";
import { decryptField } from "@/platform/crypto";
import { getChildInHousehold, listDevices } from "@/parent/operations";
import { deleteChildAction, revokeDeviceAction } from "../../actions";
import { requireParentPage } from "../../page-guard";
import styles from "../../parent.module.css";

export default async function ChildDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ setup?: string }> }) {
  const { id } = await params;
  const { setup } = await searchParams;
  const parent = await requireParentPage(`/children/${id}`, { gate: "area", needHousehold: true });
  const child = await getChildInHousehold(parent.householdId!, id);
  if (!child) notFound();
  const [t, ta] = await Promise.all([getTranslations("parent"), getTranslations("ageBands")]);
  const name = (child.nicknameEnc && decryptField(child.nicknameEnc)) || t("child");
  const devices = (await listDevices({ userId: parent.userId, householdId: parent.householdId! })).filter((d) => d.meta.childId === child.id);
  const fmt = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : t("never"));

  return (
    <>
      <Card>
        <div className={styles.stack}>
          <h1 className={styles.h1}>{name}</h1>
          <p className={styles.muted}>{ta(child.ageBand)}</p>
          <a href={`/children/${child.id}/settings`}>{t("changeSettings")}</a>
        </div>
      </Card>

      <Card>
        <div className={styles.stack}>
          <h2 className={styles.h1}>{t("devicesTitle")}</h2>
          {devices.length === 0 ? <p className={styles.muted}>{t("noDevices")}</p> : null}
          <ul className={styles.list}>
            {devices.map((d) => (
              <li key={d.id} className={styles.row}>
                <span>
                  <strong>{d.name}</strong> <span className={styles.muted}>{d.start}…</span>
                  <br />
                  <small className={styles.muted}>
                    {t("lastUsed")}: {fmt(d.lastRequest)} · {t("expires")}: {fmt(d.expiresAt)}
                  </small>
                </span>
                <form action={revokeDeviceAction}>
                  <input type="hidden" name="keyId" value={d.id} />
                  <input type="hidden" name="next" value={`/children/${child.id}`} />
                  <Button variant="secondary" type="submit">{t("revoke")}</Button>
                </form>
              </li>
            ))}
          </ul>
          <form method="post" action="/api/parent/devices" className={styles.stack}>
            {setup ? <p className={styles.notice}>{t("stepOf", { n: 4 })}: {t("handOver", { name })}</p> : null}
            <p className={styles.muted}>{t("setUpHint")}</p>
            <input type="hidden" name="childId" value={child.id} />
            <Field label={t("deviceLabel")} name="label" maxLength={32} defaultValue="Tablet" />
            <Button type="submit">{t("setUpThisDevice", { name })}</Button>
          </form>
        </div>
      </Card>

      <Card className={styles.danger}>
        <form action={deleteChildAction} className={styles.stack}>
          <p>{t("deleteChildConfirm")}</p>
          <input type="hidden" name="childId" value={child.id} />
          <Button variant="quietDanger" type="submit">{t("deleteChild")}</Button>
        </form>
      </Card>
    </>
  );
}
