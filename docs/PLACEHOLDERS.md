# Placeholders

Every `TODO(PLACEHOLDER)` in code or UI is listed here. A milestone with open entries is not done (CLAUDE.md rule 4).

**How art placeholders work (D-044):**
- Every asset the app expects is listed in `design/asset-ids.ts`.
- If its file is approved in `assets/manifest.json`, the real image shows. If not, a grey box labelled `TODO(PLACEHOLDER) <id>` shows in the right shape.
- When you deliver a file and it's approved, it replaces the box automatically on the next build. No code change is needed.
- To list what's still missing: `missingAssets()` in `design/assets.ts`.

## Open: art (as of 2026-10-13, after the Batch 3–5 delivery, D-072)
| Asset | Where it shows | Until it arrives |
|---|---|---|
| `dock_calm` (redo) | **The dock's Calm button, on every child screen** | Grey `TODO(PLACEHOLDER)` box |
| `ui_mic_object` (redo) | Onboarding, the microphone stop | Grey box |
| `place_home_map_v` (redo) | Home's place map in portrait | Grey box; its stones stay provisional until it is measured |
| `mascot_speaking_closed`, `mascot_speaking_open` (redo) | Talk, while Feelio speaks | Talk shows the happy pose (lip-sync needs all three frames) |

No longer needed after the redesign (D-071), still listed in `design/asset-ids.ts` but not used by any screen: `story_shelf`, `scene_story_corner_land/_port`, `story_book_open`, `story_page_paper`, `story_book_cover`, `ui_story_slot`.

## Open: functionality gaps (honest, visible, never faked)
| Gap | Where | Why | Closes |
|---|---|---|---|
| Talk works only for adult testing | `child/voice.ts` (`not_approved` refusal) | ElevenLabs hasn't approved use by children (D-005); `VOICE_ADULT_TESTING=1` only while the owner tests | ElevenLabs approval |
| Calm shows "coming soon" | `app/child/calm/page.tsx` (`TODO(PLACEHOLDER)`) | The calm corner (slow breathing with Feelio, static audio only) is not scheduled yet (D-055) | When you schedule it |
| Arabic story narration | `safety/voice-lines/tts.ts` | No Arabic voice chosen yet (D-064); the button is hidden for Arabic stories | When an Arabic voice is chosen |
| Levels say "This adventure is still being made" | `world/level/LevelPlayer.tsx` | No artifacts built yet; the catalog is empty (`world/artifacts/catalog.ts`) | Milestone 4 |
| Developer test artifact (dev and test runs only) | `world/artifacts/dev/DevTestArtifact.tsx` | Lets the level flow run end to end before real artifacts exist. Never in production (unit-tested) | Removed or kept as a dev tool when Milestone 4 adds real artifacts |
| Home portrait map: stone positions are provisional | `content/worlds/base/world.json` (`home.map.vertical.provisional: true`); every other place map was measured from its art (2026-10-11 Home landscape, 2026-10-13 the other eight) | `place_home_map_v` is a redo | When it is delivered |
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
