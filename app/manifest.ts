import type { MetadataRoute } from "next";

// Installable child app (SPEC §4.1). Icons are the brand's simplified mascot outline on a lilac tile,
// composed by scripts/build-assets.ts from brand/mini-mascot.png (no drawing).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Feelio",
    short_name: "Feelio",
    start_url: "/",
    scope: "/",
    display: "fullscreen",
    orientation: "any",
    background_color: "#F3ECFF",
    theme_color: "#F3ECFF",
    icons: [
      { src: "/generated/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/generated/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/generated/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
