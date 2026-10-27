import { redirect } from "next/navigation";
import { getChild } from "@/auth/guards";
import { roomState } from "@/child/room";
import { getChildView } from "@/child/view";
import { Dock } from "@/child/ui/Dock";
import { Heartbeat } from "../Heartbeat";
import { SoundSetting } from "../SoundSetting";
import { TimeUp } from "../TimeUp";
import { Room } from "./Room";

// My room (D-074): the child's bedroom with their character, wardrobe and keepsakes.
export default async function RoomPage() {
  const child = await getChild();
  if (!child) redirect("/");
  const view = await getChildView(child);
  if (!view?.onboarding.done) redirect("/");
  if (view.timeUp) return <TimeUp pause={view.pause} />;
  const state = await roomState(child.childId, view.features.stories);
  return (
    <>
      <SoundSetting on={view.sound} />
      <Heartbeat />
      <Room initial={state} storiesOn={view.features.stories} />
      <Dock active="collection" stories={view.features.stories} talk={view.features.talk} />
    </>
  );
}
