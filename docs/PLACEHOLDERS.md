# Placeholders

Every `TODO(PLACEHOLDER)` in code or UI is listed here. A milestone with open entries is not done (CLAUDE.md rule 4).

**How art placeholders work (D-044):**
- Every asset the app expects is listed in `design/asset-ids.ts`.
- If its file is approved in `assets/manifest.json`, the real image shows. If not, a grey box labelled `TODO(PLACEHOLDER) <id>` shows in the right shape.
- When you deliver a file and it's approved, it replaces the box automatically on the next build. No code change is needed.
- To list what's still missing: `missingAssets()` in `design/assets.ts`.

## Open: art (as of 2026-10-10, after D-053)
| Group (`docs/ASSET_REQUESTS.md`) | Assets | Visible in Milestone 1b |
|---|---|---|
| Onboarding objects (Batch 2, group 3) | `ui_sign_plate`, `ui_say_bubble`, `ui_grownup_door`, `ui_mic_object` | **Yes, on every child screen.** Sign, bubble and door appear everywhere; the mic in onboarding |
| Open-gate scenes (Batch 2, group 3) | `scene_meadow_land_open`, `scene_meadow_port_open` | Yes (onboarding stop 5) |
| Character colours (Batch 2, group 4) | `avatar_bun_rose_idle`, `avatar_bun_lilac_idle`, `avatar_bun_sky_idle` | Yes, when a colour other than amber is shown |
| "What do you like?" (Batch 2, group 5) | `like_animals`, `like_space`, `like_music`, `like_drawing`, `like_ballgames`, `like_nature`, `like_blocks`, `like_sea` | Yes (onboarding stop 3) |
| Mascot poses | `mascot_pointing` (Batch 2), `mascot_listening` (Batch 1 P3) | Yes (onboarding stops 2–4) |
| Dock (D-055) | `dock_calm` | **Yes, on every child screen** (the dock's 5th button) |
| Level flow, P1 (Batch 3, D-056) | `place_home_map_v`, `node_in_progress`, `ui_celebrate_burst`, `loading_place_home`, `level_home_1`…`level_home_5`, `mascot_making` | **Yes.** Home's portrait map is a grey box (landscape delivered 2026-10-11); the others show stand-ins or are left out (LEVEL_FLOW.md §6) |
| Level flow, P2 (Batch 3) | Park, School, Club and Market maps, arrival pictures and level icons (32) | When those places open |
| Mascot poses, optional | `mascot_excited` | No: the map uses `mascot_feel_excited` until it exists |
| Mascot voice poses (Milestone 5) | `mascot_thinking`, `mascot_speaking_half/closed/open` | No |

**Milestone 1b closes when the 19 assets in the first five rows are delivered and approved** (was 38; D-053 removed 19).

## Open: functionality gaps (honest, visible, never faked)
| Gap | Where | Why | Closes |
|---|---|---|---|
| Talk works only for adult testing | `child/voice.ts` (`not_approved` refusal) | ElevenLabs hasn't approved use by children (D-005); `VOICE_ADULT_TESTING=1` only while the owner tests | ElevenLabs approval |
| Talk mascot poses: listening, thinking, speaking (3 mouth frames) | `design/asset-slots.ts` `TALK_MASCOT` | Not delivered; the screen falls back to approved poses (idle, happy) | When delivered |
| Calm shows "coming soon" | `app/child/calm/page.tsx` (`TODO(PLACEHOLDER)`) | The calm corner (slow breathing with Feelio, static audio only) is not scheduled yet (D-055) | When you schedule it |
| Stories shows "coming soon" | `app/child/stories/page.tsx` (`TODO(PLACEHOLDER)`) | The storybook generator is Milestone 6 | Milestone 6 |
| Levels say "This adventure is still being made" | `world/level/LevelPlayer.tsx` | No artifacts built yet; the catalog is empty (`world/artifacts/catalog.ts`) | Milestone 4 |
| Developer test artifact (dev and test runs only) | `world/artifacts/dev/DevTestArtifact.tsx` | Lets the level flow run end to end before real artifacts exist. Never in production (unit-tested) | Removed or kept as a dev tool when Milestone 4 adds real artifacts |
| Place-map stone positions are provisional | `content/worlds/base/world.json` (`map.<orientation>.provisional: true`; Home landscape measured 2026-10-11) | No place-map art to measure yet | When each place map is delivered |
| Arabic fixed voice lines are captions only | `safety/voice-lines/` | English uses Jessica (D-064). Arabic waits for the owner to choose a voice | When an Arabic voice is chosen |
| Voice proxy is not bound to a child's voice session | `app/api/voice/llm/route.ts` (adult-only spike, off unless `VOICE_SPIKE_ENABLED=1`) | The session gate is Milestone 5 (D-061) | Milestone 5 |
| Crisis resources have no phone numbers | `content/safety/resources/baseline.json` | Markets not chosen; numbers must be verified per country (D-059) | When the first market is chosen |
| Crisis card and mascot mood in voice | Proxy (client tools) | Whether a custom LLM can trigger client tools is unverified (D-004) | Milestone 5 |
| Child-side "tell a grown-up / something felt wrong" button | none yet | Belongs on the Talk screen, where it has context (D-066) | Milestone 5 |
| Parent email verification is off | `auth/server.ts` | No email provider chosen | When you pick a provider |

## Asset delivery, 2026-10-11
27 assets approved and wired (Home level flow, signs and bubble, grown-up door, onboarding pictures, character colours, mascot pointing, listening and making). Still shown as grey boxes:
- `place_home_map_v` (the Home map on phones): redo, see ASSET_REQUESTS
- `ui_mic_object` (onboarding microphone stop): redo
- `dock_calm` (Calm dock icon): redo
- `mascot_thinking`, `mascot_speaking_*`: Talk screen poses (fall back to approved poses, no grey box)
