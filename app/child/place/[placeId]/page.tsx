import { redirect } from "next/navigation";
import { getChild } from "@/auth/guards";
import { getChildView } from "@/child/view";
import { Dock } from "@/child/ui/Dock";
import { loadWorld } from "@/world/load";
import { PlaceMapView } from "@/world/place/PlaceMapView";
import { Heartbeat } from "../../Heartbeat";
import { SoundSetting } from "../../SoundSetting";
import { TimeUp } from "../../TimeUp";

// A place's own map with its levels (D-056). Server-checked: a locked or unknown place sends the child
// back to the world map, so a typed address can't open it.
export default async function PlacePage({ params, searchParams }: { params: Promise<{ placeId: string }>; searchParams: Promise<{ from?: string }> }) {
  const child = await getChild();
  if (!child) redirect("/");
  const view = await getChildView(child);
  if (!view?.onboarding.done) redirect("/");
  if (view.timeUp) return <TimeUp pause={view.pause} />;

  const { placeId } = await params;
  const place = loadWorld("base").places.find((p) => p.id === placeId);
  const progress = place ? view.world.places[place.id] : null;
  if (!place || !progress || progress.state === "locked") redirect("/");

  const { from } = await searchParams;
  const fromLevelId = from && place.levels.some((l) => l.id === from) ? from : null;

  return (
    <>
      <SoundSetting on={view.sound} />
      <Heartbeat />
      <PlaceMapView
        place={place}
        progress={progress}
        locale={view.locale}
        avatar={view.avatar}
        fromLevelId={fromLevelId}
        scenariosOn={view.features.scenarios}
      />
      <Dock active="map" stories={view.features.stories} talk={view.features.talk} />
    </>
  );
}
