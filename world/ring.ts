import type { CSSProperties } from "react";

/** Where the ring's tube runs in ring_current's art (fractions of the image, measured from the file):
 *  half-width, half-height and the centre's height. Used to lay the ring exactly on a stone's rim
 *  (D-054), on the world map and on every place map. */
export const RING_ART = { rx: 0.4222, ry: 0.1705, cy: 0.513 };

/** Absolute position and size (in % of the map stage) that lay the ring on an oval stone. */
export function ringStyle(stone: { x: number; y: number; rx: number; ry: number }): CSSProperties {
  return {
    left: `${stone.x * 100}%`,
    top: `${stone.y * 100}%`,
    width: `${(stone.rx / RING_ART.rx) * 100}%`,
    height: `${(stone.ry / RING_ART.ry) * 100}%`,
    translate: `-50% -${RING_ART.cy * 100}%`,
  };
}
