# Level flow and loading (Milestone 1c, D-056, D-057)

How a child goes from the world map into a place, plays a level, and sees their progress. It also covers the loading system every screen uses, and every visual asset the flow needs.

**Status (2026-10-11):**
- The flow, states, server checks, loading system and tests are built and verified by running them (§8).
- No level has a real activity ("artifact") yet. A level without one says so honestly. Only in development, a clearly labelled developer test stands in, so the flow can be tested end to end.
- The place-map art and the other new assets are requested (§6) but not delivered. Until then the screens use stand-ins (§6, "Until delivered").

## 1. The journey
```
World map ──tap an open place──► Place map ──tap a level──► Level ──finish──► Celebration
   ▲          (iris + loading)      │  ▲        (iris + loading)   │  (saving)        │
   │                                │  └───────── leave (X) ───────┘                  │
   └──────── back (‹) ──────────────┘  ◄──── keep going: walk to the next stone ─────┤
   ◄─────────── keep going, when the place is finished or a new place opened ───────┘
```

| Screen | Address | What's on it | Server checks before it renders |
|---|---|---|---|
| World map | `/` | The world, places, the characters on the current place | Onboarding done, time left |
| Place map | `/place/<placeId>` | The place's own art, one stone per level, the ring on the next level, the characters beside it, a back button, the name sign, the dock | Place exists and isn't locked, else back to `/` |
| Level | `/place/<placeId>/level/<levelId>` | The level's artifacts, one after another, and a leave button. No dock (one thing at a time) | Level is reachable, belongs to that place, scenarios allowed, time left. Otherwise back to the place map |
| Celebration | (same address, after the last artifact) | The star, Feelio cheering, what opened, the place's progress row, one "keep going" button | The server's answer to "complete" |

- **Tapping a locked stone or place:** a gentle "Not yet! Let's finish level 2 first." Never an error, never a sound of failure.
- **Scenarios switched off by the parent:** the place map still shows. Tapping a level says "Your grown-up has turned these adventures off for now", and the server refuses the level anyway (CR-2).
- **Keep going:**
  - If the level opened a new place, or finished this one, the child goes to the world map. The characters walk there (existing map logic).
  - Otherwise the child goes back to the place map, and the characters walk from the finished stone to the next one (`?from=<levelId>`).

## 2. Levels, artifacts and progress
### Level states (`world/unlock.ts`)
| State | Meaning | Stone art (slot, §5) | Extras |
|---|---|---|---|
| `locked` | Its unlock rule isn't met, or its place is locked | `node_locked` | Lock badge, dimmed number |
| `available` | Reachable, not started | `node_current` | The glowing ring when it's the next one to play |
| `in_progress` | Started (an artifact was opened), not all artifacts finished | `node_in_progress`, stand-in `node_current` | Ring when it's next |
| `completed` | Every artifact finished. Replayable | `node_completed` | Star badge |

- Unlocking is data (`world.json` unlock rules). Today: each level needs the one before it; a place needs 3 levels of the place before it. Completing level *n* therefore unlocks level *n+1*, and Home's third level opens the Park.
- The **current level** of a place is the first reachable level that isn't completed. The ring and the characters mark it.

### Artifacts (`world/artifacts/`)
An artifact is one playable activity inside a level: an authored, reviewed scenario or game (SPEC §5.3, Milestone 4). A level plays its artifacts in order and is completed when all of them are.
- `catalog.ts`: the registered artifact ids (plain data, used by the server). **Empty today.** A level lists its artifacts in `world.json` (`scenarioIds`). Only registered ids can be played or completed, so unreviewed content can never be served.
- `loaders.ts`: the code for each registered artifact, loaded on demand (one chunk per artifact).
- `types.ts`: the contract. An artifact gets `artifactId`, `levelId`, `locale`, `ageBand`, `onComplete()` and `onExit()`. Nothing personal, and it reports no answers.
- **To add an artifact:**
  1. Build the component.
  2. Add its id to `ARTIFACT_CATALOG` and a loader to `ARTIFACT_LOADERS`.
  3. List its id in the level's `scenarioIds`.

  A unit test fails if those three disagree.
- **No artifact yet:** the level screen shows Feelio and "This adventure is still being made. Come back soon!", and a button back to the place. Nothing pretends to be content (CR-4).
- **Developer test stand-in** (`dev-test`): only in development and test runs, only for levels without a real artifact. It looks like a developer tool (dashed box, system font, "Developer test: not a real activity"). Production never registers it, and the server refuses it there (`NODE_ENV` check, unit-tested).

### Progress storage and the API
- `progress` table, one row per (child, pack, level, artifact).
  - `status` is `started` or `completed`.
  - Additive migration `0002_progress_status`: existing rows default to `completed`.
  - Retention: with the child's profile (PRIVACY.md). Nothing about the child's choices or answers is stored.
- `POST /api/child/progress` with `{action: "start" | "complete", levelId, artifactId}`.
  - Child scope, same-origin only, strict body.
  - `child/progress.ts` checks, in order: the level exists; scenarios are allowed; time is left; the level isn't locked; the artifact belongs to the level.
  - Refusals: 404 unknown, 400 not in level, 403 locked, disabled or time up.
- The answer to "complete" says what changed: `levelCompleted`, `nextArtifactId`, `nextLevelId`, `nextLevelOpened`, `placeCompleted`, `openedPlaceIds`, and the place's new states. The celebration is built only from this answer, never guessed by the client.

## 3. The loading system (`child/ui/loading/`)
One loading experience for the whole child app. It looks the same everywhere, and only the details change per context.

| Piece | What it does |
|---|---|
| `LoadingScene` | The scene: a flat backdrop (the destination's colour), Feelio hopping, and the **beat** (heart, cloud and star bouncing in turn: "working on it"). Below them, a big caption. Optional arrival picture of the place |
| `useTransitionTo` | The one transition between screens: the scene opens as a circle (iris) from the thing the child tapped, then the app navigates. Plays the "whoosh" sound |
| `RouteLoading` (`app/child/loading.tsx`) | While a child screen's data loads on the server, the same scene shows, with the context read from the address |
| `useLoad` | Runs a loading task with the shared timing: at least 650 ms (no flicker); after 5 s the caption becomes "Almost there…"; a failure becomes the problem phase |
| `preloadImages` / image gate | A place map waits until its art is downloaded and decoded, so it appears whole |

**Phases:**
- **loading:** the context caption.
- **slow** (after 5 s): "Almost there…".
- **problem:** the confused Feelio, "Hmm, that didn't come. Let's try again!", and a big round retry button. It is never the child's fault, and there is no error text.

**Contexts:**
| Context | Used for | Mascot (slot) | Extra | Caption |
|---|---|---|---|---|
| `place` | Opening a place map | `mascot_walking_right` | `loading_place_<id>` arrival picture once delivered | "Off we go!" |
| `level` | Opening a level, loading the next artifact, saving ("Saving your star…") | `mascot_thinking`, stand-in `mascot_happy` | | "Getting your adventure ready…" |
| `generic` | Any other child screen, going back to the world map | `mascot_idle` | | "Just a moment…" |

**Continuity:**
- A hand-over from one scene to the next (overlay → route loading → screen gate) is invisible: same layout and same colour.
- The beat keeps its rhythm across scenes, because its phase comes from the page clock.
- The scene leaves with a 320 ms fade over the loaded screen.

**Reduced motion:**
- The iris becomes a short fade.
- Feelio doesn't hop.
- The beat becomes a gentle opacity pulse.

**Accessibility:** the scene is a `role="status"` live region, so screen readers hear the caption.

## 4. Place maps (`world/place/PlaceMapView.tsx`)
- **Data:** `world.json` → `places[].map.{horizontal,vertical}`. Each has:
  - the art's asset id
  - its size
  - its backdrop colour
  - a walking path
  - one stone per level: centre, oval and path index
- **Fit:** fitted whole in the screen, like the world map (D-054). The glass dock floats over it (D-055). Horizontal map from tablet width up.
- **`map.<orientation>.provisional: true`** (per orientation, since one orientation can arrive first): the stones are a temporary S-curve layout. When the art is delivered, Claude Code measures the 5 pads, updates the data and sets `provisional: false`. The schema checks there is exactly one stone per level.
- **The characters** stand beside the next level's stone, not on it, so its number stays visible and tappable. They ignore taps.

## 5. Asset slots: references are configuration (`design/asset-slots.ts`)
Screens ask for a **slot**, never a file. A slot lists asset ids in order of preference, and the first approved one is used.
- **A new asset appears** as soon as it is approved, with no code change.
- **`pick(slot)`:** if nothing is delivered, it returns the first id, which shows as a grey labelled `TODO(PLACEHOLDER)` box.
- **`pickOptional(slot)`:** if nothing is delivered, the screen leaves the picture out (arrival pictures, level icons, the celebration burst).
- **Per-place and per-level art is named in `world.json`** (`map.*.asset`, `levels[].icon`), so a world pack can bring its own. A unit test checks every referenced id is an expected asset.

## 6. Visual assets the flow needs
All are generated by the owner in ChatGPT from the prompts in `docs/ASSET_REQUESTS.md` **Batch 3**, checked by Claude Code against the rejection list, then logged. Style for all: the shared style block (flat 2D kawaii vector, soft pastel gradients, brand palette, no text). Formats: ChatGPT PNG at the size below, built to WebP at several widths by `npm run assets:build`.

| Asset id | Purpose | Style notes | Format | Where it's used | Until delivered |
|---|---|---|---|---|---|
| `place_home_map_h`, `place_home_map_v` (**P1**) | Home's own map with 5 empty stone pads on a path | Same style, camera and stones as the world map; house, patio table, toy corner, bedroom window, garden gate; plain strip at top for the sign | 1536×1024 / 1024×1536 PNG, opaque | Place map, Home | Grey placeholder box; stones on the provisional layout |
| `place_{park,school,club,market}_map_{h,v}` (P2) | The other places' maps | As above, with each place's areas | as above | Place maps | as above |
| `node_in_progress` (**P1**) | Stone for a started, unfinished level | Edit of `node_current`: half amber, half green | 1024² PNG, transparent | Place map, progress row | `node_current` |
| `ui_celebrate_burst` (**P1**) | Soft light burst behind the star | 12 rounded pale amber/rose rays, sparkles, empty centre | 1024² PNG, transparent | Celebration | Left out |
| `loading_place_<id>` (Home **P1**, others P2) | Arrival picture: where the child is going | One object: Home's front door, the park arch, school doors, the club stage, a market awning | 1024² PNG, transparent | Loading scene, `place` context | Left out (Feelio and the beat still show) |
| `level_<place>_<1-5>` (Home **P1**, others P2) | What each level is about, for children who can't read yet | One chunky object per level theme (e.g. Home 4 "Bedtime worries": a cosy bed with a night-light and moon) | 1024² PNG, transparent | Above each stone on the place map | Left out |
| `mascot_making` (**P1**) | "Still being made", cheerful and honest | Official mascot holding a paintbrush and a toolbox | 1024² PNG, transparent | Level screen without artifacts | `mascot_happy` |
| `mascot_thinking` (already requested, Batch 1 P3) | Loading a level | Official mascot, thinking pose | 1024² PNG, transparent | Loading scene, `level` context | `mascot_happy` |
| `mascot_excited` (already requested, optional) | Cheering | Official mascot, excited | 1024² PNG, transparent | Celebration, arrival walk | `mascot_feel_excited` |
| `ui_sign_plate` (already requested, Batch 2) | The place's name sign | Wooden sign like the map's | 1536×1024 PNG, transparent | Place map top | Grey placeholder box |

Already approved and reused: `node_locked`, `node_current`, `node_completed`, `badge_lock`, `badge_star`, `ring_current`, the three companions (loading beat), `mascot_walking_left/right`, `mascot_marker`, `mascot_idle`, `mascot_happy`, `mascot_confused`, `mascot_feel_excited`, `dock_map`.

**Not requested on purpose:**
- The transitions (iris, fade, hop, beat, pop) are motion on delivered images and flat colours, not drawings.
- Back, leave and retry buttons use functional icons from the icon library.

## 7. Files
`world/unlock.ts` (states and unlocks) · `child/progress.ts` (server) · `app/api/child/progress/route.ts` · `world/artifacts/*` · `world/place/*` · `world/level/*` · `child/ui/loading/*` · `design/asset-slots.ts` · `app/child/place/[placeId]/…` · `app/child/loading.tsx` · `drizzle/0002_progress_status.sql`

## 8. Tests (verified by running them, 2026-10-11)
- **Unit:**
  - level states, unlock diff
  - catalog and loader consistency
  - the dev stand-in is never offered in production
  - every asset referenced in `world.json` is an expected asset
  - every state has stone art
  - place-map validation
- **Integration** (Neon, synthetic data):
  - refusals: locked, not in level, unknown, scenarios off
  - started → in progress, completed → next level opens
  - replay unlocks nothing new
  - the third Home level opens the Park
- **End to end** (Playwright, dev server):
  - world map → loading scene → Home map → locked "not yet" → level → leave (in progress) → finish → celebration (with progress row) → keep going → level 2 available
  - Arabic portrait
  - address and API refusals
