// Every visual asset the app expects, with its shape. Delivered assets (design/asset-index.generated.json,
// built from assets/manifest.json) render as images; expected but undelivered ones render as grey
// TODO(PLACEHOLDER) boxes of the right shape (ASSET_PROTOCOL). Each id here maps to a request in
// docs/ASSET_REQUESTS.md. Undelivered ids are listed in docs/PLACEHOLDERS.md.

export type AssetShape = "square" | "landscape" | "portrait" | "wide";

const square = [
  // mascot (Batch 1 + 2)
  "mascot_idle", "mascot_idle_blink", "mascot_marker", "mascot_walking_left", "mascot_walking_right",
  "mascot_happy", "mascot_excited", "mascot_waving", "mascot_sleeping", "mascot_confused", "mascot_head_happy",
  "mascot_pointing", "mascot_listening", "mascot_thinking",
  "mascot_speaking_half", "mascot_speaking_closed", "mascot_speaking_open",
  "mascot_feel_excited", "mascot_feel_sad", "mascot_feel_angry",
  // ui
  "dock_map", "dock_talk", "dock_stories", "dock_collection",
  "badge_lock", "badge_star", "badge_check", "node_locked", "node_current", "node_completed", "ring_current",
  "ui_grownup_door", "ui_mic_object",
  "like_animals", "like_space", "like_music", "like_drawing", "like_ballgames", "like_nature", "like_blocks", "like_sea",
  // brand companions (exported from the official SVGs)
  "companion_heart", "companion_cloud", "companion_star",
] as const;

const wide = ["ui_sign_plate", "ui_say_bubble"] as const;
const landscape = ["global_horizental", "global_horizontal_ar", "scene_meadow_land", "scene_meadow_land_open"] as const;
const portrait = ["global_vertical", "global_vertical_ar", "scene_meadow_port", "scene_meadow_port_open"] as const;

// D-053 (owner, 2026-10-10): one character for now ("bun"), four colours, one pose. Its "yay" is a
// code hop. The approved bean/puff bases stay in assets/ for later but are not used.
export const AVATAR_SHAPES = ["bun"] as const;
export const AVATAR_COLOURS = ["amber", "rose", "lilac", "sky"] as const;
export const AVATAR_POSES = ["idle"] as const;
export type AvatarShape = (typeof AVATAR_SHAPES)[number];
export type AvatarColour = (typeof AVATAR_COLOURS)[number];
export type AvatarPose = (typeof AVATAR_POSES)[number];
export type AvatarAssetId = `avatar_${AvatarShape}_${AvatarColour}_${AvatarPose}`;

const avatars = AVATAR_SHAPES.flatMap((s) =>
  AVATAR_COLOURS.flatMap((c) => AVATAR_POSES.map((p) => `avatar_${s}_${c}_${p}` as AvatarAssetId)),
);

export type AssetId =
  | (typeof square)[number]
  | (typeof wide)[number]
  | (typeof landscape)[number]
  | (typeof portrait)[number]
  | AvatarAssetId;

export const EXPECTED_ASSETS: Record<AssetId, AssetShape> = Object.fromEntries([
  ...square.map((id) => [id, "square"]),
  ...wide.map((id) => [id, "wide"]),
  ...landscape.map((id) => [id, "landscape"]),
  ...portrait.map((id) => [id, "portrait"]),
  ...avatars.map((id) => [id, "square"]),
]) as Record<AssetId, AssetShape>;

export const SHAPE_RATIO: Record<AssetShape, number> = { square: 1, wide: 1.5, landscape: 1.5, portrait: 2 / 3 };
