import { redirect } from "next/navigation";
import { getChild } from "@/auth/guards";
import { getChildView } from "@/child/view";
import { Dock } from "@/child/ui/Dock";
import { Scene } from "@/child/ui/Scene";
import { env } from "@/platform/env";
import { resources } from "@/safety/content";
import { RESOURCE_KINDS } from "@/safety/voice-agent/tools";
import { loadWorld } from "@/world/load";
import { Heartbeat } from "../Heartbeat";
import { TimeUp } from "../TimeUp";
import { TalkScreen } from "./TalkScreen";

// Talk (Milestone 5, D-068): the voice companion. The page only renders when the parent allows Talk
// and the child may play now (server-side, CR-2); starting a talk passes the session gate again.
// Everything the screen may show is prepared here from reviewed data: place names, the places the
// child can reach, and the crisis resources for the market.
export default async function Talk() {
  const child = await getChild();
  if (!child) redirect("/");
  const view = await getChildView(child);
  if (!view?.onboarding.done) redirect("/");
  if (!view.features.talk) redirect("/");
  if (view.timeUp) return <TimeUp pause={view.pause} />;

  const world = loadWorld("base");
  const places = world.places.map((p) => ({ id: p.id, name: p.name[view.locale], open: view.world.places[p.id]?.state !== "locked" }));
  const help = resources([...RESOURCE_KINDS], env().DEFAULT_MARKET, view.locale).map((r) => ({ kind: r.kind, text: r.text }));

  return (
    <>
      <Heartbeat />
      <Scene land="scene_meadow_land" port="scene_meadow_port" alt="" testId="talk">
        <TalkScreen places={places} help={help} />
      </Scene>
      <Dock active="talk" stories={view.features.stories} talk />
    </>
  );
}
