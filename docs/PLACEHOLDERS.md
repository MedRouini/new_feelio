# Placeholders

Every `TODO(PLACEHOLDER)` in code or UI is listed here. A milestone with open entries is not done (CLAUDE.md rule 4).

**How art placeholders work (D-044):**
- Every asset the app expects is listed in `design/asset-ids.ts`.
- If its file is approved in `assets/manifest.json`, the real image shows. If not, a grey box labelled `TODO(PLACEHOLDER) <id>` shows in the right shape.
- When you deliver a file and it's approved, it replaces the box automatically on the next build. No code change is needed.
- To list what's still missing: `missingAssets()` in `design/assets.ts`.

## Open: art (as of 2026-10-13, D-074)
| Asset | Where it shows | Until it arrives |
|---|---|---|
| Batch 6: `scene_my_room_land/_port` | My room | The approved treasure-room scene stands in |
| Batch 6: `room_wardrobe`, `room_gift_box`, `room_star_shelf`, `room_feelings_jar`, `room_pinboard`, `room_book_stack` | My room objects and the gift close-up | Grey `TODO(PLACEHOLDER)` boxes with the object's name |
| Batch 6: 16 `wear_*` items | Wardrobe tiles; on the character once worn | Grey boxes in the wardrobe; nothing on the character |

## Open: functionality gaps (honest, visible, never faked)
| Gap | Where | Why | Closes |
|---|---|---|---|
| Talk works only for adult testing | `child/voice.ts` (`not_approved` refusal) | ElevenLabs hasn't approved use by children (D-005); `VOICE_ADULT_TESTING=1` only while the owner tests | ElevenLabs approval |
| Calm shows "coming soon" | `app/child/calm/page.tsx` (`TODO(PLACEHOLDER)`) | The calm corner (slow breathing with Feelio, static audio only) is not scheduled yet (D-055) | When you schedule it |
| Arabic story narration | `safety/voice-lines/tts.ts` | No Arabic voice chosen yet (D-064); the button is hidden for Arabic stories | When an Arabic voice is chosen |
| Levels say "This adventure is still being made" | `world/level/LevelPlayer.tsx` | No artifacts built yet; the catalog is empty (`world/artifacts/catalog.ts`) | Milestone 4 |
| Developer test artifact (dev and test runs only) | `world/artifacts/dev/DevTestArtifact.tsx` | Lets the level flow run end to end before real artifacts exist. Never in production (unit-tested) | Removed or kept as a dev tool when Milestone 4 adds real artifacts |
| Arabic fixed voice lines are captions only | `safety/voice-lines/` | English uses Jessica (D-064). Arabic waits for the owner to choose a voice | When an Arabic voice is chosen |
| Voice proxy is not bound to a child's voice session | `app/api/voice/llm/route.ts` (adult-only spike, off unless `VOICE_SPIKE_ENABLED=1`) | The session gate is Milestone 5 (D-061) | Milestone 5 |
| Crisis resources have no phone numbers | `content/safety/resources/baseline.json` | Markets not chosen; numbers must be verified per country (D-059) | When the first market is chosen |
| Crisis card and mascot mood in voice | Proxy (client tools) | Whether a custom LLM can trigger client tools is unverified (D-004) | Milestone 5 |
| Child-side "tell a grown-up / something felt wrong" button | none yet | Belongs on the Talk screen, where it has context (D-066) | Milestone 5 |
| My room positions and item placements are provisional | `content/room/layout.json`, `content/room/wardrobe.json` (`provisional: true`) | Measured from the art when Batch 6 arrives | Batch 6 |
| Parent email verification is off | `auth/server.ts` | No email provider chosen | When you pick a provider |

## Asset delivery, 2026-10-11
27 assets approved and wired (Home level flow, signs and bubble, grown-up door, onboarding pictures, character colours, mascot pointing, listening and making). Still shown as grey boxes:
- `place_home_map_v` (the Home map on phones): redo, see ASSET_REQUESTS
- `ui_mic_object` (onboarding microphone stop): redo
- `dock_calm` (Calm dock icon): redo
- `mascot_thinking`, `mascot_speaking_*`: Talk screen poses (fall back to approved poses, no grey box)
