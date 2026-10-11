import { redirect } from "next/navigation";
import { getChild } from "@/auth/guards";
import { getChildView } from "@/child/view";
import { Heartbeat } from "../Heartbeat";
import { SoundSetting } from "../SoundSetting";
import { TimeUp } from "../TimeUp";
import { Onboarding } from "./Onboarding";

// Onboarding "Arriving in Feelio's world" (docs/ONBOARDING.md). Resumes at the next unfinished stop.
export default async function Hello() {
  const child = await getChild();
  if (!child) redirect("/");
  const view = await getChildView(child);
  if (!view) redirect("/");
  if (view.onboarding.done) redirect("/");
  if (view.timeUp) return <TimeUp pause={view.pause} />;
  return (
    <>
      <SoundSetting on={view.sound} />
      <Heartbeat />
      <Onboarding
        locale={view.locale}
        startStep={view.onboarding.step}
        avatar={view.avatar}
        talkEnabled={view.features.talk}
        parentNickname={view.parentNickname}
      />
    </>
  );
}
