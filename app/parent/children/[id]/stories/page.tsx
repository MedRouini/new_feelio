import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { BookOpen } from "lucide-react";
import { parentStories } from "@/child/stories";
import { Button } from "@/design/components/Button";
import { decryptField } from "@/platform/crypto";
import { getChildInHousehold } from "@/parent/operations";
import { deleteStoryAction } from "../../../actions";
import { requireParentPage } from "../../../page-guard";
import styles from "../../../parent.module.css";

// Stories tab (D-070): the stories this child made (titles, dates, themes), kept until a parent
// deletes them (owner decision 2026-10-11). Deleting removes the story, its pictures and narration.
export default async function ChildStories({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ deleted?: string }> }) {
  const { id } = await params;
  const { deleted } = await searchParams;
  const parent = await requireParentPage(`/children/${id}/stories`, { gate: "area", needHousehold: true });
  const child = await getChildInHousehold(parent.householdId!, id);
  if (!child) notFound();
  const [t, locale] = await Promise.all([getTranslations("parent"), getLocale()]);
  const name = (child.nicknameEnc && decryptField(child.nicknameEnc)) || t("child");
  const stories = await parentStories(parent.householdId!, child.id);
  const fmt = (d: Date) => new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en", { day: "numeric", month: "short", year: "numeric" }).format(d);
  const here = `/children/${child.id}/stories`;

  return (
    <section className={styles.card} aria-labelledby="stories-title">
      <div className={styles.sectionHead}>
        <span className={styles.iconTile} data-tone="purple">
          <BookOpen size={20} aria-hidden />
        </span>
        <h2 id="stories-title" className={styles.sectionTitle}>{t("storiesTitle", { name })}</h2>
      </div>
      <p className={styles.muted}>{t("storiesNote")}</p>
      {deleted ? (
        <p className={styles.success} role="status">
          {t("storyDeleted")}
        </p>
      ) : null}
      {stories.length === 0 ? <p className={styles.muted}>{t("storiesNone")}</p> : null}
      <ul className={styles.list} data-testid="parent-stories">
        {stories.map((s) => (
          <li key={s.id} className={styles.listRow}>
            <div className={styles.stackTight}>
              <span className={styles.listTitle}>{s.title}</span>
              <span className={[styles.muted, styles.small].join(" ")}>
                {fmt(s.createdAt)} · {t("storyTheme", { hero: locale === "ar" ? s.hero.ar : s.hero.en, feeling: locale === "ar" ? s.feeling.ar : s.feeling.en })}
              </span>
            </div>
            <form action={deleteStoryAction}>
              <input type="hidden" name="storyId" value={s.id} />
              <input type="hidden" name="next" value={here} />
              <Button variant="quietDanger" type="submit">{t("deleteStory")}</Button>
            </form>
          </li>
        ))}
      </ul>
    </section>
  );
}
