import { redirect } from "next/navigation";
import { getChild } from "@/auth/guards";
import { checkLevelAccess } from "@/child/progress";
import { getChildView } from "@/child/view";
import { LevelPlayer } from "@/world/level/LevelPlayer";
import { Heartbeat } from "../../../../Heartbeat";
import { SoundSetting } from "../../../../SoundSetting";
import { TimeUp } from "../../../../TimeUp";

// One level: plays its artifacts in order, saves progress, then celebrates (D-056). Every check runs
// on the server first (child/progress.ts). A locked level, a level of another place, or scenarios
// switched off by the parent: back to the place map, never an error screen.
export default async function LevelPage({ params }: { params: Promise<{ placeId: string; levelId: string }> }) {
  const child = await getChild();
  if (!child) redirect("/");
  const view = await getChildView(child);
  if (!view?.onboarding.done) redirect("/");
  if (view.timeUp) return <TimeUp />;

  const { placeId, levelId } = await params;
  const access = await checkLevelAccess(child, levelId);
  if (!access.ok) redirect(access.reason === "unknown" ? "/" : `/place/${placeId}`);
  if (access.place.id !== placeId) redirect(`/place/${access.place.id}/level/${levelId}`);

  const levels = [...access.place.levels].sort((a, b) => a.order - b.order).map((l) => ({ id: l.id, order: l.order }));
  const tint = access.place.map.horizontal.backdrop;

  return (
    <>
      <SoundSetting on={view.sound} />
      <Heartbeat />
      <LevelPlayer
        placeId={placeId}
        placeName={access.place.name[view.locale]}
        level={{ id: levelId, order: access.level.order, title: access.level.title[view.locale] }}
        levels={levels}
        progress={access.state.places[placeId]}
        artifacts={access.artifacts}
        doneArtifacts={access.doneArtifacts}
        locale={view.locale}
        ageBand={view.ageBand}
        tint={tint}
        placeNames={Object.fromEntries(access.world.places.map((p) => [p.id, p.name[view.locale]]))}
      />
    </>
  );
}
