import { notFound } from "next/navigation";
import { loadWorld } from "@/world/load";
import { HotspotEditor } from "./HotspotEditor";

// Dev-only hotspot editor (MAP.md §2). Not available outside `next dev`: production returns 404.
export default function EditorPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <HotspotEditor world={loadWorld("base")} />;
}
