import { asset, type AssetId } from "@/design/assets";

type Props = {
  id: AssetId;
  /** Accessible description; pass "" for decorative images. */
  alt: string;
  /** CSS width the image is shown at, used to pick the right size (e.g. "240px", "40vw"). */
  sizes: string;
  className?: string;
  priority?: boolean;
};

/** Renders an approved, pre-built asset. Never mirrored (the mascot must never be flipped). */
export function AssetImage({ id, alt, sizes, className, priority }: Props) {
  const a = asset(id);
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
      style={{ height: "auto", maxWidth: "100%" }}
    />
  );
}
