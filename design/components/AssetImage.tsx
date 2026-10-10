import type { CSSProperties } from "react";
import { asset, assetRatio, type AssetId } from "@/design/assets";
import { Placeholder } from "./Placeholder";

type Props = {
  id: AssetId;
  /** Accessible description; pass "" for decorative images. */
  alt: string;
  /** CSS width the image is shown at, used to pick the right size (e.g. "240px", "40vw"). */
  sizes: string;
  className?: string;
  style?: CSSProperties;
  priority?: boolean;
};

/**
 * Renders an approved, pre-built asset, or a grey TODO(PLACEHOLDER) box of the same shape when the
 * asset has not been delivered yet. Never mirrors anything (the mascot must never be flipped).
 */
export function AssetImage({ id, alt, sizes, className, style, priority }: Props) {
  const a = asset(id);
  if (!a) {
    return <Placeholder assetId={id} ratio={assetRatio(id)} className={className} style={style} label={alt} />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- assets are pre-built WebP with srcset
    <img
      src={a.src}
      srcSet={a.srcSet}
      sizes={sizes}
      width={a.width}
      height={a.height}
      alt={alt}
      className={className}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
      style={{ height: "auto", maxWidth: "100%", ...style }}
    />
  );
}
