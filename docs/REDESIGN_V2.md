# Redesign v2: every page its own world (proposal, 2026-10-12)

**Status (2026-10-12): accepted and built, D-071.** Built: captions, the AI notice on Talk and Story only, no blur, the Talk nook, the story theatre, the library, the treasure room. Not built yet: Calm sky, night meadow. The art actually requested is ASSET_REQUESTS Batch 5 (a smaller list than below: the curtains, scroll, stage light, signpost and the Calm and night scenes are not needed for what is built).

Owner brief (2026-10-12): stop the bubble on every page; no blurred backgrounds; say "Feelio is an AI" in one clear place instead of everywhere; every page must show its purpose at a glance through its visuals, layout and motion; Story, Talk and Collection need their own creative direction. A polished children's game, not an app. Rethink each page from a child's point of view.

## What changes everywhere
- **Feelio speaks in the language of each place, not in a bubble.** Feelio's line is always heard (audio) and shown as a short caption, but the caption takes the form of the page: a wooden signpost on the map, words written on the book page in Stories, glowing words floating up from Feelio in Talk, a little name tag in the Collection, a soft cloud only in Calm. The speech bubble stays only in onboarding, where Feelio introduces itself.
- **Real scenes, never blur.** Each page gets its own illustrated place (requested as assets, below). Until one arrives, the page uses a flat brand-colour backdrop with soft shapes (allowed: flat brand colours and gradients), never a blurred copy of the meadow.
- **One way to say "I'm an AI"** (see decision 1).
- **Motion with meaning:** each page has one signature animation that explains it (the book opening, the stage curtain rising, the album page turning, Feelio's voice glowing), instead of the same pop-in everywhere.

## Page by page (what a child sees, what it means)
| Page | The idea, in a child's words | Signature moment | Feelio |
|---|---|---|---|
| **Map (home)** | "This is my world." | Feelio walks to the place you tap | Caption on a wooden signpost next to Feelio |
| **Talk** | "Feelio's cosy nook, where we chat." A warm little treehouse nook at dusk with a lamp and cushions; Feelio sits facing you. | Feelio's voice becomes floating glowing sparkles (the brand star, heart and cloud) that rise and dance while it talks; when you talk they drift toward Feelio | Big and close, like a video call with a friend; words float up as soft subtitles, then fade |
| **Story workshop** | "A little theatre where we build a story." A puppet-theatre stage with curtains. | The four choices become the stage: the **place** drops in as the backdrop, the **hero** walks on stage, the **feeling** changes the stage lights' colour, the **adventure** unrolls as a scroll; when all four are set, the curtain closes and opens on your book | Feelio is the director in the corner with a little megaphone pose |
| **Bookshelf** | "My books." A real wooden bookshelf in a cosy library corner. | Books slide out of the shelf when you tap them | Feelio sits on top of the shelf, reading |
| **Storybook** | "A real book." (already a book; keeps the page turn) | The cover opens like a real book | Feelio as a small narrator sticker on the page (already) |
| **Collection** (replaced by **My room**, D-074, 2026-10-13) | "My treasure room": the child's own character in its room, with a **sticker album** of everything earned: stars from levels, the covers of their stories, feelings they explored | The album opens and its pages turn; new stickers peel on with a shine; tapping one makes it bounce and Feelio says what it is | Feelio holds the album, then steps aside |
| **Calm** (to build) | "A quiet sky where we breathe." | A cloud that grows and shrinks with your breath | Floats sleepily on a cloud |
| **Resting / time up** | "Feelio is asleep, come back tomorrow." A night version of the meadow. | Stars come out, Feelio yawns and curls up | Sleeping pose (have) |

## Assets this needs (Batch 5; the pages are built so each one drops in)
- Scenes (landscape + portrait each): `scene_talk_nook`, `scene_story_stage` (theatre with curtains as a separate layer `ui_stage_curtain_left/right`), `scene_library_corner` (replaces the story corner), `scene_treasure_room`, `scene_calm_sky`, `scene_meadow_night`.
- Objects: `ui_sticker_album_open` (blank pages), `ui_signpost` (caption sign for the map), `ui_megaphone` or `mascot_directing`, `ui_story_scroll`, `ui_stage_light`.
- Mascot poses: `mascot_reading` (requested), `mascot_directing`, `mascot_sitting_close` (Talk, close-up), `mascot_holding_album`, `mascot_sleepy_cloud`.
- Plus Batch 4 (book, shelf, choice pictures), which these pages use.

## Order
1. Remove the repeated AI notices (decision 1) and the blur; flat brand backdrops in the meantime.
2. Feelio's captions in each page's own form (no bubble outside onboarding).
3. Talk nook, then the Story theatre and library, then the Collection album (each built so its scene drops in).
4. Calm, and the night meadow for resting.
