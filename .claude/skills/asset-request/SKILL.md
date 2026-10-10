---
name: asset-request
description: Use whenever Feelio needs any visual asset (mascot pose, icon, badge, background, frame, empty state, map) or when the owner says an asset was delivered. Writes ChatGPT prompt entries in docs/ASSET_REQUESTS.md in the protocol format, and reviews delivered files against the rejection checklist before logging them in assets/manifest.json. Claude Code never draws assets.
---

# Asset requests and delivery review (Feelio)

Source of truth: `docs/ASSET_PROTOCOL.md`, with `docs/MASCOT.md` (mascot prompt and poses) and `docs/ART_DIRECTION.md` (style). If this skill and the protocol disagree, the protocol wins.

## Hard rule
Claude Code **never draws** visual assets: no hand-written SVG, canvas or CSS illustrations, no emoji or stock-icon stand-ins, no redrawn or "improved" mascot, no image-generation tools. Allowed in code: layout, flat brand colours and gradients, typography, borders, shadows, motion, and masks or filters on delivered images. Plain functional icons (back, close, settings, mic, play/pause) come from the one icon library. Dock icons, badges, locks, stars and level nodes are **not** functional icons, so request them.

Until an asset arrives: a grey CSS box with a visible label `TODO(PLACEHOLDER): asset <id>`, the same marker in code, and a line in `docs/PLACEHOLDERS.md`.

## A. Writing a request
1. Check `docs/ASSET_REQUESTS.md` and `assets/manifest.json` first. Don't request something that exists or is already requested.
2. Add the entry to the current milestone's batch, **priority order first** (what blocks work now goes on top).
3. Use exactly this block:
```
### <asset-id>   status: requested
- Used in: <screen / feature / state>
- Purpose: <one line>
- Size and ratio: <1024x1024 square | 1536x1024 landscape | 1024x1536 portrait>
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: <OFFICIAL MASCOT | approved map | asset-id of approved style reference>
- Save as: assets/approved/<map|mascot|ui|world|stories>/<filename>.png
- Prompt (paste into ChatGPT):
  > ...
```
4. Prompt rules:
   - Start with "Create an image." and state the ratio and the transparent background.
   - Include the **shared style block** from the protocol verbatim.
   - **Mascot:** use the standard mascot prompt from `docs/MASCOT.md` ("Keep this exact character … Change only the pose and expression: [POSE] and [FACE]"). Always upload `brand/mascot/default/png/IMG_9937.png`, plus the first approved pose (`mascot_idle`) as a second reference once it exists, plus the matching official face PNG where one exists (happy, excited, sad, angry).
   - **Mouth or blink frames:** "Edit the attached image … only the mouth/eyes change", pixel-aligned with the base pose.
   - **World-matching assets:** "I attached the approved map. Match its art style, colours, camera angle and level of detail."
   - End with "No text, no letters, no logos, no watermark, no extra characters." Add "no people" for scenes.
   - One asset per request, except sprite sheets (a grid with generous spacing).
   - Ask for 1024 px or more.
   - **Never** ask for text inside art. Labels are localised and drawn by code (Arabic and RTL).
   - **Never** request a mirrored mascot. Left and right poses are separate requests.
5. Add a row to the Log table at the bottom of `docs/ASSET_REQUESTS.md`.

## B. Reviewing a delivered file
1. Open the file and **look at it** (Read tool). Also check it in code: dimensions, colour type and alpha (PIL: `im.mode`, `getchannel('A').histogram()`), and whether the alpha box touches an edge (cropped subject).
2. Apply the **rejection checklist**. Any hit means `status: redo`:
   - [ ] Text, letters, numbers or fake writing anywhere
   - [ ] Mascot drift: antenna with amber orb, dark-blue screen face with sparkle eyes, pink cheeks, belly heart, stubby arm-flaps and feet, correct default colourway (amber top → rose → purple feet), same proportions as `IMG_9937.png`
   - [ ] Extra characters or people
   - [ ] Style differs from the approved map (world assets) or the official mascot (mascot assets)
   - [ ] Halo or white fringe on the transparent edges (check against a dark background), or a fake checkerboard baked in
   - [ ] Cropped subject (alpha box touching the frame edge)
   - [ ] Wrong pose or expression for the request
   - [ ] Unsafe or age-inappropriate content (scary, sexualised, violent, real-person likeness)
   - [ ] For frame sets (mouth, blink): not pixel-aligned with the base pose
3. **Redo:** set the status to `redo`, say exactly what failed, and write an adjusted prompt (add the specific fix, e.g. "the belly heart is missing; keep the pale heart on the belly as in the attachment").
4. **Pass:**
   - Convert to WebP or AVIF at the needed sizes in the build step. Never edit the art itself.
   - Add it to `assets/manifest.json`: `{ "id", "file", "prompt", "tool": "ChatGPT", "date", "chat_link", "approved": true, "reviewed_by": "claude-code", "checks": [...] }`.
   - Set the status to `approved` and fill the Log row.
   - Replace the `TODO(PLACEHOLDER)` and remove its line from `docs/PLACEHOLDERS.md`.
5. Report to the owner in one line per asset: approved, or redo with the reason.
