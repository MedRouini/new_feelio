import { getTranslations } from "next-intl/server";
import { bookshelf, storyGate } from "@/child/stories";
import { Dock } from "@/child/ui/Dock";
import { Heartbeat } from "../Heartbeat";
import { TimeUp } from "../TimeUp";
import { storiesChild } from "./guard";
import { Shelf } from "./Shelf";

// My stories (D-070): the child's bookshelf and the way into making a new story with Feelio.
export default async function Stories() {
  const { child, view } = await storiesChild();
  if (view.timeUp) return <TimeUp pause={view.pause} />;
  const t = await getTranslations("child.stories");
  const [books, refusal] = await Promise.all([bookshelf(child.childId), storyGate(child.childId)]);
  return (
    <>
      <Heartbeat />
      <main data-testid="stories">
        <Shelf
          books={books.map((b) => ({ id: b.id, title: b.title, coverReady: b.coverReady, read: b.read }))}
          canMake={refusal === null}
          line={refusal && refusal !== "daily_cap" ? t(`refused.${refusal}`) : refusal === "daily_cap" ? t("refused.daily_cap") : books.length ? t("makeWith") : t("empty")}
        />
      </main>
      <Dock active="stories" stories talk={view.features.talk} />
    </>
  );
}
