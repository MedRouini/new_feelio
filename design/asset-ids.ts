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
  "dock_map", "dock_talk", "dock_stories", "dock_collection", "dock_calm",
  "badge_lock", "badge_star", "badge_check", "node_locked", "node_current", "node_completed", "ring_current",
  "ui_grownup_door", "ui_mic_object",
  "like_animals", "like_space", "like_music", "like_drawing", "like_ballgames", "like_nature", "like_blocks", "like_sea",
  // brand companions (exported from the official SVGs)
  "companion_heart", "companion_cloud", "companion_star",
  // brand feeling faces (official exports, brand/feelings-expressions/png): the Talk feeling card (D-068)
  "face_happy", "face_sad", "face_angry", "face_excited",
  // level flow and loading (Batch 3, D-056, docs/LEVEL_FLOW.md)
  "node_in_progress", "ui_celebrate_burst", "mascot_making",
  // stories (Batch 4, D-070, docs/STORIES.md): optional art; screens work without it
  "mascot_reading", "ui_story_slot", "ui_story_wand",
  // redesign v2 (Batch 5, docs/REDESIGN_V2.md): optional art; pages work without it
  "mascot_directing", "mascot_holding_album",
  "face_worried", "face_proud", "face_lonely", "face_jealous",
  "story_hero_fox", "story_hero_bear", "story_hero_bunny", "story_hero_owl", "story_hero_turtle", "story_hero_dragon", "story_hero_cat", "story_hero_penguin",
  "story_place_forest", "story_place_beach", "story_place_space", "story_place_castle", "story_place_garden", "story_place_underwater",
  "story_adv_lost_toy", "story_adv_new_friend", "story_adv_big_race", "story_adv_birthday", "story_adv_storm", "story_adv_first_day",
] as const;

// Per-place assets (Batch 3, D-056): place ids of the base world. world.json refers to these by id;
// a unit test checks that every id it uses is expected here.
export const WORLD_PLACE_IDS = ["home", "park", "school", "club", "market"] as const;
export type WorldPlaceId = (typeof WORLD_PLACE_IDS)[number];
const LEVELS_PER_PLACE = [1, 2, 3, 4, 5] as const;
type PlaceSquareId = `loading_place_${WorldPlaceId}` | `level_${WorldPlaceId}_${(typeof LEVELS_PER_PLACE)[number]}`;
const placeSquare = WORLD_PLACE_IDS.flatMap((p) => [
  `loading_place_${p}` as PlaceSquareId,
  ...LEVELS_PER_PLACE.map((n) => `level_${p}_${n}` as PlaceSquareId),
]);
const placeLandscape = WORLD_PLACE_IDS.map((p) => `place_${p}_map_h` as const);
const placePortrait = WORLD_PLACE_IDS.map((p) => `place_${p}_map_v` as const);

const wide = ["ui_sign_plate", "ui_say_bubble"] as const;
const landscape = ["global_horizental", "global_horizontal_ar", "scene_meadow_land", "scene_meadow_land_open", "story_book_open", "story_shelf", "scene_story_corner_land", "scene_talk_nook_land", "scene_story_stage_land", "scene_library_land", "scene_treasure_room_land", "ui_sticker_album_open"] as const;
const portrait = ["global_vertical", "global_vertical_ar", "scene_meadow_port", "scene_meadow_port_open", "story_page_paper", "story_book_cover", "scene_story_corner_port", "scene_talk_nook_port", "scene_story_stage_port", "scene_library_port", "scene_treasure_room_port"] as const;

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
  | AvatarAssetId
  | PlaceSquareId
  | (typeof placeLandscape)[number]
  | (typeof placePortrait)[number];

export const EXPECTED_ASSETS: Record<AssetId, AssetShape> = Object.fromEntries([
  ...square.map((id) => [id, "square"]),
  ...wide.map((id) => [id, "wide"]),
  ...landscape.map((id) => [id, "landscape"]),
  ...portrait.map((id) => [id, "portrait"]),
  ...avatars.map((id) => [id, "square"]),
  ...placeSquare.map((id) => [id, "square"]),
  ...placeLandscape.map((id) => [id, "landscape"]),
  ...placePortrait.map((id) => [id, "portrait"]),
]) as Record<AssetId, AssetShape>;

export const SHAPE_RATIO: Record<AssetShape, number> = { square: 1, wide: 1.5, landscape: 1.5, portrait: 2 / 3 };
