# Interactive global map (current scope)

## What exists
The owner has two approved illustrated global maps showing the places (Home, Park, School, Club, Market and others) joined by a path:
- `assets/approved/map/global_vertical.*` for portrait (phones).
- `assets/approved/map/global_horizontal.*` for landscape (tablets, desktop).

Place-level maps (the inside of each place) do **not** exist yet. For now, tapping a place opens a code-built place card with its levels. Place maps will arrive later as new assets, through the protocol in `docs/ASSET_PROTOCOL.md`.

## What to build (all in code, no drawn art)
1. **Orientation-aware rendering.** Use the horizontal image in landscape and the vertical image in portrait, switching on resize and rotation without losing state.
2. **Hotspots.** Each place is a real button positioned over the image. Positions live in `content/worlds/<pack>/world.json` as fractions of the image, separately for each orientation:
   ```json
   "maps": {
     "vertical":   {"image": "global_vertical.webp",   "places": {"park": {"x": 0.30, "y": 0.62, "r": 0.08}}},
     "horizontal": {"image": "global_horizontal.webp", "places": {"park": {"x": 0.35, "y": 0.50, "r": 0.06}}}
   }
   ```
   First view each image yourself and propose positions. Then build a **dev-only hotspot editor** (not in the production build): drag the markers on the image and export the JSON, so the owner can correct positions in minutes.
3. **Pan and zoom.** Pinch, wheel and drag, clamped to the image bounds, with a sensible minimum scale so the whole map is visible. Double-tap to zoom to a place. Smooth, 60 fps on a mid-range tablet.
4. **States per place:** locked (dimmed with a lock badge, gentle shake and a short mascot line when tapped), unlocked, current (pulsing ring, the mascot marker stands here), completed (star badge). Locked and completed states are drawn by code from delivered badge images, never with drawn art.
5. **Mascot marker.** Stands on the current place. When a place unlocks, it walks along the path to it. The path is a polyline stored in data for each orientation. Uses delivered mascot poses (`mascot_walking_left/right`, `mascot_marker`); until they exist, a grey labelled box marked `TODO(PLACEHOLDER)`.
6. **Place card.** Tapping an unlocked place opens a bottom sheet (or side panel on landscape tablets): place name in the current language, the place's levels as code-drawn numbered nodes with locked, current and completed states, and a big Play button. No illustrations in the card until assets are delivered.
7. **Phone-style dock:** Map, Talk, Stories, My collection (see SPEC §4.1). Icons are requested assets.
8. **Right-to-left.** UI mirrors. Horizontal map: mirror the image and hotspots so the journey reads right to left, but never mirror the mascot, and keep badges readable. Propose this in `DECISIONS.md` and confirm with me (the art has no text, so mirroring is possible).
9. **Accessibility.** Every hotspot has a localized accessible name and an audio description; keyboard focus order follows the path; `prefers-reduced-motion` disables walking and pulsing.
10. **Performance.** WebP or AVIF at sizes suited to the viewport (`srcset`), a low-quality placeholder while loading, 500 KB or less per delivered map image where possible. Report page weight per screen.
11. **Data-driven growth.** Places, unlock rules, levels and positions are all data, so adding a place or a world pack ("Feelio visits ___") is a data and asset change, not a code change.
12. **Tests.** An end-to-end test per orientation that taps every hotspot, checks locked and unlocked behaviour, rotates the device mid-session, and checks the RTL layout.

## Next maps (later, through asset requests)
Per-place maps and extra world chapters follow `docs/WORLD_PLAN.md`. Do not start them before I ask.
