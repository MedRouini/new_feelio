import type { RoomUpdate } from "@/child/room";

/** Saves a room change; retries once after a short pause. The child never sees an error. */
export async function saveRoom(update: RoomUpdate): Promise<{ ok: boolean; opened?: string }> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch("/api/child/room", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(update) });
      if (res.ok) return { ok: true, ...((await res.json()) as { opened?: string }) };
      if (res.status === 400) return { ok: false }; // refused (e.g. locked): no retry
    } catch {
      // network: try once more
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  return { ok: false };
}
