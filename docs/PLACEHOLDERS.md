# Placeholders

Every `TODO(PLACEHOLDER)` in code or UI is listed here. A milestone with open entries is not done (CLAUDE.md rule 4).

**How art placeholders work (D-044):**
- Every asset the app expects is listed in `design/asset-ids.ts`.
- If its file is approved in `assets/manifest.json`, the real image shows. If not, a grey box labelled `TODO(PLACEHOLDER) <id>` shows in the right shape.
- When you deliver a file and it's approved, it replaces the box automatically on the next build. No code change is needed.
- To list what's still missing: `missingAssets()` in `design/assets.ts`.

## Open: art
Batch 8 (voice room, D-076): 7 mascot activity poses and 3 start objects, **optional**. Until each is approved the room uses an approved stand-in pose or brand companion (`child/activities.ts`, `OFFER_ART` in `design/asset-slots.ts`), never a grey box. Everything else in `design/asset-ids.ts` is approved.

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
| Voice room activities need the agent re-synced | `safety/voice-agent/sync.ts` | The live agent still lists the old tools; the proxy only sends tools the agent offered, so `offer_activity` reaches the screen after `npx tsx --env-file=.env safety/voice-agent/sync.ts --yes` with a live tunnel (D-076) | When you next open a tunnel |
| Noticing game has no ambient sounds | `app/child/talk/ActivityStage.tsx` | No approved audio; sounds aren't in the image pipeline (D-076) | If you want them: choose a sound source |
| Child-side "tell a grown-up / something felt wrong" button | none yet | Belongs on the Talk screen, where it has context (D-066) | Milestone 5 |
| Parent email verification is off | `auth/server.ts` | No email provider chosen | When you pick a provider |

## Asset delivery, 2026-10-11
27 assets approved and wired (Home level flow, signs and bubble, grown-up door, onboarding pictures, character colours, mascot pointing, listening and making). Still shown as grey boxes:
- `place_home_map_v` (the Home map on phones): redo, see ASSET_REQUESTS
- `ui_mic_object` (onboarding microphone stop): redo
- `dock_calm` (Calm dock icon): redo
- `mascot_thinking`, `mascot_speaking_*`: Talk screen poses (fall back to approved poses, no grey box)
