"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Sends a heartbeat once a minute while the page is visible. The server counts the time and decides
 * when today's limit is reached; then the page refreshes and the server shows the warm goodbye.
 */
export function Heartbeat() {
  const router = useRouter();
  useEffect(() => {
    const beat = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/child/heartbeat", { method: "POST" });
        if (res.ok && (await res.json()).timeUp) router.refresh();
      } catch {
        // offline: nothing to count
      }
    };
    const id = setInterval(beat, 60_000);
    return () => clearInterval(id);
  }, [router]);
  return null;
}
