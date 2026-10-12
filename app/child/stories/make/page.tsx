import { redirect } from "next/navigation";
import { getDraft, storyGate } from "@/child/stories";
import { Dock } from "@/child/ui/Dock";
import { CHOICES, SLOTS } from "@/safety/stories/choices";
import { Heartbeat } from "../../Heartbeat";
import { TimeUp } from "../../TimeUp";
import { storiesChild } from "../guard";
import { Workshop } from "./Workshop";

// The story workshop (D-070): four slots, filled by tapping (and by voice with Feelio when Talk is on).
// Only list choices and checked ideas are ever saved, on the server.
export default async function MakeStory() {
  const { child, view } = await storiesChild();
  if (view.timeUp) return <TimeUp pause={view.pause} />;
  if (await storyGate(child.childId)) redirect("/stories");
  const draft = await getDraft(child.childId);
  const lists = Object.fromEntries(SLOTS.map((s) => [s, CHOICES[s].map((c) => ({ id: c.id, en: c.en, ar: c.ar }))]));
  const filled = Object.fromEntries(SLOTS.flatMap((s) => (draft[s] ? [[s, { id: draft[s]!.id, en: draft[s]!.en, ar: draft[s]!.ar }]] : [])));
  return (
    <>
      <Heartbeat />
      <main data-testid="story-workshop">
        <Workshop lists={lists as never} initial={filled} voice={view.features.talk} />
      </main>
      <Dock active="stories" stories talk={view.features.talk} />
    </>
  );
}
