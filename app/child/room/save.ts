import type { RoomUpdate } from "@/child/room";
import { serial } from "./serial";

const queue = serial();

/** Saves a room change after the ones before it (never out of order); retries once. The child never sees an error. */
export function saveRoom(update: RoomUpdate): Promise<{ ok: boolean; opened?: string }> {
  return queue(() => send(update));
}

async function send(update: RoomUpdate): Promise<{ ok: boolean; opened?: string }> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      // keepalive: a change still saves when the child taps and leaves the room straight away
      const res = await fetch("/api/child/room", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(update), keepalive: true });
      if (res.ok) return { ok: true, ...((await res.json()) as { opened?: string }) };
      if (res.status === 400) return { ok: false }; // refused (e.g. locked): no retry
    } catch {
      // network: try once more
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  return { ok: false };
}
