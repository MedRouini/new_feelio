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
| Mascot poses, optional | `mascot_excited` | No: the map uses `mascot_feel_excited` until it exists |
| Mascot voice poses (Milestone 5) | `mascot_thinking`, `mascot_speaking_half/closed/open` | No |

**Milestone 1b closes when the 19 assets in the first five rows are delivered and approved** (was 38; D-053 removed 19).

## Open: functionality gaps (honest, visible, never faked)
| Gap | Where | Why | Closes |
|---|---|---|---|
| Talk shows "coming soon" | `app/child/talk/page.tsx` (`TODO(PLACEHOLDER)`) | The voice companion is Milestone 5 | Milestone 5 |
| Stories shows "coming soon" | `app/child/stories/page.tsx` (`TODO(PLACEHOLDER)`) | The storybook generator is Milestone 6 | Milestone 6 |
| Level stones say "adventures are being made" | `world/map/MapView.tsx` | No reviewed scenarios yet (`scenarioIds: []`) | Milestone 4 |
| Fixed voice lines are captions only | `safety/voice-lines/` | Waiting for you to choose voices and allow the run (D-037). Dry run: 38 lines, 1,687 chars ≈ 844–1,687 credits | When you pick the voices |
| Parent email verification is off | `auth/server.ts` | No email provider chosen | When you pick a provider |
| Screen-time days are counted in UTC | `child/usage.ts` | Household timezone and schedule settings come in Milestone 3 | Milestone 3 |
