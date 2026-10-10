"use client";

import { useRef, useState } from "react";
import { AssetImage } from "@/design/components/AssetImage";
import type { AssetId } from "@/design/assets";
import type { Orientation, World } from "@/world/schema";

// Development tool only (route returns 404 in production). Drag place circles, stepping stones and path
// points on each map, then export the JSON to paste into content/worlds/base/world.json.

type Handle = { kind: "hotspot" | "pad"; place: string } | { kind: "path"; i: number };

const round = (v: number) => Math.round(v * 1000) / 1000;

export function HotspotEditor({ world }: { world: World }) {
  const [o, setO] = useState<Orientation>("horizontal");
  const [maps, setMaps] = useState(world.maps);
  const [drag, setDrag] = useState<Handle | null>(null);
  const [copied, setCopied] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const m = maps[o];

  const move = (e: React.PointerEvent) => {
    if (!drag || !box.current) return;
    const r = box.current.getBoundingClientRect();
    const x = round(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)));
    const y = round(Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)));
    setMaps((all) => {
      const next = structuredClone(all);
      const map = next[o];
      if (drag.kind === "path") map.path[drag.i] = [x, y];
      else map.places[drag.place][drag.kind] = { ...map.places[drag.place][drag.kind], x, y };
      return next;
    });
  };

  const json = JSON.stringify({ maps }, null, 2);
  const dot = (x: number, y: number, size: string, colour: string, h: Handle, label: string) => (
    <button
      key={label}
      type="button"
      title={label}
      onPointerDown={(e) => {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        setDrag(h);
      }}
      style={{
        position: "absolute",
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        width: size,
        aspectRatio: "1",
        transform: "translate(-50%,-50%)",
        borderRadius: "50%",
        border: `3px solid ${colour}`,
        background: `${colour}33`,
        cursor: "move",
        padding: 0,
        fontSize: 11,
        color: "#000",
      }}
    >
      {label.split(":")[0]}
    </button>
  );

  return (
    <div style={{ padding: 16, fontFamily: "system-ui", background: "#fff", minHeight: "100vh" }} dir="ltr">
      <h1 style={{ fontSize: 18 }}>Hotspot editor (dev only)</h1>
      <p>
        <button type="button" onClick={() => setO("horizontal")} disabled={o === "horizontal"}>Horizontal</button>{" "}
        <button type="button" onClick={() => setO("vertical")} disabled={o === "vertical"}>Vertical</button>{" "}
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(json);
            setCopied(true);
          }}
        >
          {copied ? "Copied" : "Copy JSON"}
        </button>{" "}
        <a href={`data:application/json;charset=utf-8,${encodeURIComponent(json)}`} download="maps.json">Download</a>
      </p>
      <p style={{ fontSize: 13 }}>Blue: place hit area · Orange: stepping stone · Green: path points. Paste the result over the &quot;maps&quot; object in world.json.</p>
      <div
        ref={box}
        onPointerMove={move}
        onPointerUp={() => setDrag(null)}
        style={{ position: "relative", width: o === "horizontal" ? "min(100%, 1100px)" : "min(100%, 560px)", userSelect: "none", touchAction: "none" }}
      >
        <AssetImage id={m.assets.en as AssetId} alt="" sizes="1100px" />
        {Object.entries(m.places).map(([id, p]) => [
          dot(p.hotspot.x, p.hotspot.y, `${p.hotspot.r * 200}%`, "#2563eb", { kind: "hotspot", place: id }, `${id}:hotspot`),
          dot(p.pad.x, p.pad.y, "28px", "#ea580c", { kind: "pad", place: id }, `${id}:pad`),
        ])}
        {m.path.map(([x, y], i) => dot(x, y, "16px", "#16a34a", { kind: "path", i }, `${i}:path`))}
      </div>
      <pre style={{ fontSize: 11, maxHeight: 240, overflow: "auto", background: "#f4f4f5", padding: 8 }}>{json}</pre>
    </div>
  );
}
