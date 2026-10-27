import { notFound } from "next/navigation";
import { FilmSpike } from "./FilmSpike";

// THROWAWAY SPIKE (2026-10-23): a sample "interactive film" scene so the owner can say "yes, like this"
// or "no". Development only: production returns 404. Not product code; not reviewed; English only.
export default function FilmSpikePage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <FilmSpike />;
}
