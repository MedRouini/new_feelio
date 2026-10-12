import { redirect } from "next/navigation";
import { getChild } from "@/auth/guards";
import { collection } from "@/child/collection";
import { getChildView } from "@/child/view";
import { Dock } from "@/child/ui/Dock";
import { Heartbeat } from "../Heartbeat";
import { SoundSetting } from "../SoundSetting";
import { TimeUp } from "../TimeUp";
import { TreasureRoom } from "./TreasureRoom";

// My collection (redesign v2, D-071): the treasure room with the child's character and sticker album.
export default async function Collection() {
  const child = await getChild();
  if (!child) redirect("/");
  const view = await getChildView(child);
  if (!view?.onboarding.done) redirect("/");
  if (view.timeUp) return <TimeUp pause={view.pause} />;
  const data = await collection(child.childId, view.world, view.features.stories);
  return (
    <>
      <SoundSetting on={view.sound} />
      <Heartbeat />
      <TreasureRoom data={data} avatar={view.avatar} name={view.name} />
      <Dock active="collection" stories={view.features.stories} talk={view.features.talk} />
    </>
  );
}
