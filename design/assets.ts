import index from "./asset-index.generated.json";
import { EXPECTED_ASSETS, SHAPE_RATIO, type AssetId } from "./asset-ids";

export type { AssetId } from "./asset-ids";

// Only approved assets from assets/manifest.json reach the app (CR-7, CR-10). The index is generated
// by scripts/build-assets.ts. Expected-but-undelivered ids resolve to null, and the UI shows a
// TODO(PLACEHOLDER) box of the right shape instead.

type Entry = { src: Record<string, string>; width: number; height: number; transparent: boolean };
const delivered = index as Record<string, Entry>;

export type ResolvedAsset = { src: string; srcSet: string; width: number; height: number; ratio: number };

export function isDelivered(id: AssetId): boolean {
  return id in delivered;
}

export function asset(id: AssetId): ResolvedAsset | null {
  const e = delivered[id];
  if (!e) return null;
  const widths = Object.keys(e.src).map(Number).sort((a, b) => a - b);
  return {
    src: e.src[String(widths[Math.min(1, widths.length - 1)])],
    srcSet: widths.map((w) => `${e.src[String(w)]} ${w}w`).join(", "),
    width: e.width,
    height: e.height,
    ratio: e.width / e.height,
  };
}

/** Width/height ratio of an asset: the real one if delivered, else the requested shape's ratio. */
export function assetRatio(id: AssetId): number {
  return asset(id)?.ratio ?? SHAPE_RATIO[EXPECTED_ASSETS[id]];
}

export function missingAssets(): AssetId[] {
  return (Object.keys(EXPECTED_ASSETS) as AssetId[]).filter((id) => !isDelivered(id));
}
