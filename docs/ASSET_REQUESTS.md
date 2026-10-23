# Asset requests (maintained by Claude Code, fulfilled by the owner in ChatGPT)

Format and rules: `docs/ASSET_PROTOCOL.md`. Mascot prompt and pose list: `docs/MASCOT.md`.
Claude Code adds a batch per milestone. Each entry has a ready-to-paste prompt, the images to upload with it, and the filename to save as.

## How to work through a batch (owner)
1. Do the entries **in order**. Priority 1 blocks Milestone 1b. Priority 3 is only needed in Milestone 4 (voice), so it can wait.
2. **One ChatGPT chat per group** (Map edits / Mascot poses / Dock icons / Badges and nodes), so the style stays locked inside each chat.
3. Upload the listed reference images **before** pasting the prompt. Ask for 3–4 tries and keep the best.
4. If ChatGPT returns a white or checkerboard background instead of real transparency, save it anyway. Claude Code checks it and asks for a fix if needed.
5. Save with the exact filename given and tell Claude Code "delivered: <asset-id>". Claude Code views the file, applies the rejection checklist, logs it in `assets/manifest.json`, and only then wires it in.

**Reference files** (already in the repo):
- `OFFICIAL MASCOT` = `brand/mascot/default/png/IMG_9937.png`
- `FACE: happy / excited / sad / angry` = PNG exports from R-00 below
- `MAP H` = `assets/approved/map/global_horizental.png`, `MAP V` = `assets/approved/map/global_vertical.png`

**Shared style block** (from `docs/ASSET_PROTOCOL.md`; already inside every prompt below):
> Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral.

---

## Batch 1 (Milestone 1b: map, dock, mascot shell; plus the voice poses of Batch A)

### Priority 1: blocks Milestone 1b

### R-00 owner-exports   status: approved (exports done 2026-10-10; optional mascot re-export still open)
- Used in: reference uploads for every mascot and collection prompt
- Purpose: ChatGPT cannot read SVG, so the brand files it needs as references must be PNG
- Size and ratio: any size ≥ 1024 px on the long side
- Background: transparent PNG
- Upload with the prompt: n/a (export from your design tool, not ChatGPT)
- Save as:
  - `brand/feelings-expressions/png/face_happy.png`, `face_excited.png`, `face_sad.png`, `face_angry.png` (from `brand/feelings-expressions/*.svg`)
  - `brand/assets/png/companion_heart.png`, `companion_cloud.png`, `companion_star.png` (from `face-svg.svg`, `cloud-face.svg`, `star-face.svg`)
  - Optional: re-export `brand/mascot/default/png/IMG_9937.png` with about 40 px padding on every side (the right arm may touch the edge today)
- Prompt (paste into ChatGPT):
  > Not a ChatGPT task. **Done 2026-10-10:** the 7 SVGs were rasterised as they are with headless Chrome (format conversion only, nothing redrawn), checked against the presentation, and logged in `assets/manifest.json`. Still optional for you: the padded re-export of `IMG_9937.png`.

### map-h-ar   status: approved (2026-10-10)
- Used in: global map, landscape, **Arabic** (Milestone 1b). English keeps the approved original (D-021)
- Purpose: the same map with the five sign words in Arabic, so Arabic-speaking children read their own language on the map
- Size and ratio: 1536×1024 landscape (same as the original)
- Background: none (full scene, opaque)
- Upload with the prompt: `MAP H`
- Save as: `assets/approved/map/global_horizontal_ar.png`
- Prompt (paste into ChatGPT):
  > Edit the attached image. Keep everything exactly identical (same size 1536×1024, same composition, same buildings, path, stone pads, trees, flowers, colours, art style and camera) and change only the words painted on the five wooden signs. Replace them with these Arabic words, written right to left with correctly connected Arabic letters, in a friendly rounded hand-painted style in the same dark brown as now, centred on each sign: the sign that says "House" → "البيت"; "School" → "المدرسة"; "Market" → "السوق"; "Park" → "الحديقة"; "Club" → "النادي". Keep each sign's shape, size, position, wood colour and posts. Do not mirror or flip the image. Do not move, add or remove anything else. No other text, no English letters, no logos, no watermark, no extra characters, no people.

### map-v-ar   status: approved (2026-10-10)
- Used in: global map, portrait, **Arabic** (Milestone 1b)
- Purpose: same as `map-h-ar`, for the vertical map
- Size and ratio: 1024×1536 portrait (same as the original)
- Background: none (full scene, opaque)
- Upload with the prompt: `MAP V`
- Save as: `assets/approved/map/global_vertical_ar.png`
- Prompt (paste into ChatGPT):
  > Edit the attached image. Keep everything exactly identical (same size 1024×1536, same composition, same buildings, path, stone pads, trees, flowers, colours, art style and camera) and change only the words painted on the five wooden signs. Replace them with these Arabic words, written right to left with correctly connected Arabic letters, in a friendly rounded hand-painted style in the same dark brown as now, centred on each sign: the sign that says "Market" → "السوق"; "Club" → "النادي"; "School" → "المدرسة"; "Park" → "الحديقة"; "House" → "البيت". Keep each sign's shape, size, position, wood colour and posts. Do not mirror or flip the image. Do not move, add or remove anything else. No other text, no English letters, no logos, no watermark, no extra characters, no people.

> Note for both Arabic maps: image models often misspell Arabic or break the letter joins. Zoom in on every sign before sending the file. If one word keeps coming out wrong, ask ChatGPT to fix only that sign ("keep everything identical, only rewrite the word on the sign near the school as المدرسة"). Claude Code reads every sign on delivery and compares the image with the original to re-measure the hotspots if anything moved. Last-resort fallback for a stubborn sign: a blank sign with the name drawn by code (D-021).

### mascot_idle   status: approved (2026-10-10)
- Used in: map marker fallback, Talk screen idle, loading, onboarding; **becomes the second reference for every later pose**
- Purpose: the neutral, calm, standing Feelio that all idle motion (breathing, bob) is applied to in code
- Size and ratio: 1024×1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `OFFICIAL MASCOT`, `FACE: happy`
- Save as: `assets/approved/mascot/mascot_idle.png`
- Prompt (paste into ChatGPT):
  > Create an image. I attached the official mascot and its official "happy" face. Keep this exact character: same design, proportions, colours, glossy kawaii vector style, antenna with amber orb, dark blue screen face with sparkle eyes, pink cheeks, heart on the belly, stubby arms and feet. Change only the pose and expression: [POSE: standing straight and relaxed, facing the viewer, both arm-flaps resting gently at its sides, feet flat] and [FACE: use the attached happy face exactly: open sparkle eyes and a small soft closed smile]. Full body, centred, transparent background PNG (plain white if transparency fails), 1024×1024, no ground shadow, no props, no text, no letters, no other characters. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Culturally neutral. No logos, no watermark.

### mascot_marker   status: approved (2026-10-10)
- Used in: global map, the marker standing on the current place
- Purpose: a small map figure that reads well at about 80 px and sits on the map like the buildings do
- Size and ratio: 1024×1024 square
- Background: transparent PNG (white if transparency fails), with a soft ground shadow
- Upload with the prompt: `OFFICIAL MASCOT`, `mascot_idle` (approved), `MAP H`
- Save as: `assets/approved/mascot/mascot_marker.png`
- Prompt (paste into ChatGPT):
  > Create an image. I attached the official mascot, an approved pose of it, and the game map it will stand on. Keep this exact character: same design, proportions, colours, glossy kawaii vector style, antenna with amber orb, dark blue screen face with sparkle eyes, pink cheeks, heart on the belly, stubby arms and feet. Change only the pose and expression: [POSE: standing happily, seen from slightly above at the same three-quarter top-down camera angle as the attached map, one arm-flap raised a little in greeting, with a soft oval ground shadow under its feet in a darker green-grey that matches the map's shadows] and [FACE: happy sparkle eyes and a small open smile]. Match the map's lighting from the top-left. Full body, centred, transparent background PNG around the character and its shadow (plain white if transparency fails), 1024×1024, no props, no text, no letters, no other characters. Flat 2D vector-style illustration for a children's mobile game, gentle glossy highlights, friendly kawaii style; not 3D, not photorealistic. No logos, no watermark.

### mascot_walking_left   status: approved (2026-10-10)
- Used in: global map, marker walking along the path toward the left; never produced by mirroring in code
- Purpose: travel animation between places (the path runs both ways, and right-to-left languages reverse the journey)
- Size and ratio: 1024×1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `OFFICIAL MASCOT`, `mascot_idle` (approved)
- Save as: `assets/approved/mascot/mascot_walking_left.png`
- Prompt (paste into ChatGPT):
  > Create an image. I attached the official mascot and an approved pose of it. Keep this exact character: same design, proportions, colours, glossy kawaii vector style, antenna with amber orb, dark blue screen face with sparkle eyes, pink cheeks, heart on the belly, stubby arms and feet. Change only the pose and expression: [POSE: walking happily toward the LEFT side of the image; body turned three-quarters to the left, leaning slightly forward, the front foot lifted mid-step, arm-flaps swinging gently, antenna bending slightly backwards with the motion] and [FACE: cheerful sparkle eyes looking to the left, small open smile]. Keep the light coming from the top-left and the glossy highlights in the same places as on the original. Full body, centred, transparent background PNG (plain white if transparency fails), 1024×1024, no ground shadow, no motion lines, no props, no text, no letters, no other characters. Flat 2D vector-style illustration for a children's mobile game, friendly kawaii style; not 3D, not photorealistic. No logos, no watermark.

### mascot_walking_right   status: approved (2026-10-10)
- Used in: global map, marker walking toward the right
- Purpose: as above, other direction. A separate drawing, because mirroring would flip the highlights and the asymmetric details
- Size and ratio: 1024×1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `OFFICIAL MASCOT`, `mascot_idle` (approved), `mascot_walking_left` (approved)
- Save as: `assets/approved/mascot/mascot_walking_right.png`
- Prompt (paste into ChatGPT):
  > Create an image. I attached the official mascot, an approved pose, and an approved walking-left pose. Keep this exact character: same design, proportions, colours, glossy kawaii vector style, antenna with amber orb, dark blue screen face with sparkle eyes, pink cheeks, heart on the belly, stubby arms and feet. Change only the pose and expression: [POSE: walking happily toward the RIGHT side of the image; body turned three-quarters to the right, leaning slightly forward, the front foot lifted mid-step, arm-flaps swinging gently, antenna bending slightly backwards with the motion; do not simply flip the walking-left image: keep the light coming from the top-left and the glossy highlights where the original has them] and [FACE: cheerful sparkle eyes looking to the right, small open smile]. Full body, centred, transparent background PNG (plain white if transparency fails), 1024×1024, no ground shadow, no motion lines, no props, no text, no letters, no other characters. Flat 2D vector-style illustration for a children's mobile game, friendly kawaii style; not 3D, not photorealistic. No logos, no watermark.

### dock_map   status: approved (2026-10-10)
- Used in: phone-style dock, "Map" button (with a code label and audio cue)
- Purpose: playful, instantly readable icon for the world map
- Size and ratio: 1024×1024 square
- Background: transparent PNG (white if transparency fails). Code draws the rounded tile behind it
- Upload with the prompt: `MAP H` (style reference)
- Save as: `assets/approved/ui/dock_map.png`
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached our game map for style. A single game icon object, centred, filling about 80% of the frame, with no tile or background shape behind it: a small folded paper map, partly open, showing a green meadow with a winding beige path and a round amber location pin standing on it. Chunky, rounded, easy to read at small size. Match the attached map's art style, colours and glossy finish. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters.

### dock_talk   status: approved (2026-10-10)
- Used in: phone-style dock, "Talk" button (opens the voice companion)
- Purpose: shows that Talk means talking with Feelio
- Size and ratio: 1024×1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `OFFICIAL MASCOT`, `mascot_idle` (approved), `dock_map` (approved, for icon style)
- Save as: `assets/approved/ui/dock_talk.png`
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached the official mascot, an approved pose of it, and an approved icon for style. A single game icon, centred, filling about 80% of the frame, no tile or background shape: the head and upper body of the attached mascot (keep it identical: antenna with amber orb, dark blue screen face with sparkle eyes, pink cheeks, same colours and glossy style), happy face with a small open smile, next to a rounded pale lilac (#EFCFF8) speech bubble with three soft purple dots inside. Same chunky, glossy icon style as the attached icon. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights, friendly kawaii style; not 3D, not photorealistic. No text, no letters, no numbers, no logos, no watermark, no other characters.

### dock_stories   status: approved (2026-10-10)
- Used in: phone-style dock, "Stories" button
- Purpose: icon for the storybook feature
- Size and ratio: 1024×1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `dock_map` (approved)
- Save as: `assets/approved/ui/dock_stories.png`
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached an approved icon; match its style exactly. A single game icon object, centred, filling about 80% of the frame, no tile or background shape: an open storybook with a soft purple (#614194) rounded cover and cream pages, a few small four-point sparkles in lilac and amber rising from the pages. The pages are completely blank: no writing, no scribbles, no pictures. Chunky, rounded, easy to read at small size. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no characters.

### dock_collection   status: approved (2026-10-10)
- Used in: phone-style dock, "My collection" button
- Purpose: icon for collected mascot moments and companions
- Size and ratio: 1024×1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `dock_map` (approved), `companion_heart.png`, `companion_cloud.png`, `companion_star.png` (from R-00)
- Save as: `assets/approved/ui/dock_collection.png`
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached an approved icon for style and three small brand characters (a heart, a cloud and a star with cute faces). A single game icon, centred, filling about 80% of the frame, no tile or background shape: a rounded keepsake box in soft rose (#FFD8E6 with #C4557C trim), lid open, with the three attached characters peeking out happily, kept identical to the attachments in shape, colour and face. Chunky, rounded, easy to read at small size, same glossy finish as the attached icon. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights, friendly kawaii style; not 3D, not photorealistic. No text, no letters, no numbers, no logos, no watermark, no other characters.

### dock_calm   status: approved (2026-10-13; the 2026-10-11 redo reason, swirls reading as "?", is fixed)
- Used in: phone-style dock, "Calm" button (the calm corner: slow breathing with Feelio)
- Purpose: icon for a quiet, calming place
- Size and ratio: 1024×1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `dock_map` (approved), `dock_stories` (approved), so the set matches
- Save as: `assets/approved/ui/dock_calm.png`
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached two approved icons; match their style exactly. A single game icon object, centred, filling about 80% of the frame, no tile or background shape: a soft round sky-blue (#D4ECFF with #79B1DE shading) cushion floating gently, with three small soft lilac (#EFCFF8) breath swirls rising above it and one tiny amber (#F3B03A) four-point sparkle. Calm, sleepy and cosy, not busy. Chunky, rounded, easy to read at small size, same glossy finish as the attached icons. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights, minimal shading, friendly kawaii style; not 3D, not photorealistic. Culturally neutral. No face, no text, no letters, no numbers, no logos, no watermark, no characters.
- **Redo prompt (2026-10-11)**, upload `dock_map`, `dock_stories` and `dock_talk` (approved):
  > Create an image. Square 1:1, transparent background. I attached three approved icons; match their style, outline and glossy finish exactly. A single game icon object, centred, filling about 80% of the frame, no tile or background shape: a soft round sky-blue (#D4ECFF with #79B1DE shading) cushion floating gently, with two soft lilac (#EFCFF8) breeze lines above it: smooth, gentle, horizontal WAVY lines like a calm breath of air, each one a simple wave. One tiny amber (#F3B03A) four-point sparkle. IMPORTANT: no curls, no hooks, no spirals, nothing that looks like a question mark, a letter or a number. Calm, sleepy and cosy, not busy. Chunky, rounded, easy to read at small size. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No face, no text, no letters, no numbers, no logos, no watermark, no characters.

### badge_lock   status: approved (2026-10-10)
- Used in: global map (locked place), place card (locked level node overlay)
- Purpose: a friendly "not yet" marker (grey = not yet), never scary or punishing
- Size and ratio: 1024×1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `dock_map` (approved)
- Save as: `assets/approved/ui/badge_lock.png`
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached an approved icon; match its style. A single chunky, rounded padlock badge, closed, in soft warm grey (#D9D5DE body with #9C95A8 shading and a darker #7D7690 shackle) with a small warm amber (#F3B03A) keyhole, a gentle glossy shine, centred, filling about 75% of the frame. Grey means "not yet": friendly and soft, not scary, not dark, not metallic. Flat 2D vector-style illustration for a children's mobile game, clean rounded shapes, minimal shading, friendly kawaii style; not 3D, not photorealistic. No face, no text, no letters, no numbers, no logos, no watermark, no characters.

### badge_star   status: approved (2026-10-10)
- Used in: global map (completed place), place card (completed level)
- Purpose: gentle "you did it" marker (effort, not score)
- Size and ratio: 1024×1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `badge_lock` (approved)
- Save as: `assets/approved/ui/badge_star.png`
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached an approved badge; match its style, size and finish exactly. A single plump five-point star with softly rounded tips, warm yellow-amber (#FFC32C to #F3B03A) with a glossy highlight on the upper left, centred, filling about 75% of the frame. No face on the star. Flat 2D vector-style illustration for a children's mobile game, clean rounded shapes, minimal shading, friendly kawaii style; not 3D, not photorealistic. No text, no letters, no numbers, no logos, no watermark, no characters.

### badge_check   status: approved (2026-10-10)
- Used in: place card (finished scenario inside a level), collection
- Purpose: a small "done" mark (green), calmer than the star
- Size and ratio: 1024×1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `badge_lock` (approved), `badge_star` (approved)
- Save as: `assets/approved/ui/badge_check.png`
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached two approved badges; match their style, size and finish exactly. A single round badge: a fresh green disc (#3E9B4F to #2E8B45) with a lighter green rim (#8FD18A) and a thick, rounded white checkmark in the middle (green means "done"), gentle glossy highlight on the upper left, centred, filling about 75% of the frame. Flat 2D vector-style illustration for a children's mobile game, clean rounded shapes, minimal shading, friendly kawaii style; not 3D, not photorealistic. No face, no text, no letters, no numbers, no logos, no watermark, no characters.

### node_locked   status: approved (2026-10-10)
- Used in: place card, level node in the locked state (code adds the level number and `badge_lock`)
- Purpose: base button art for the level path inside the place card
- Size and ratio: 1024×1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `MAP H` (the round stone pads are the style reference), `badge_lock` (approved)
- Save as: `assets/approved/ui/node_locked.png`
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached our game map (look at the round stone pads on the path) and an approved badge for finish. A single round game level button seen from slightly above, like a thick rounded stepping stone with a flat empty top and a soft darker rim, in soft warm grey (#D9D5DE top, #B3ADBD rim), with a gentle highlight. Grey means "not yet": calm, not dark, not sad. The top face is completely empty (no number, no symbol, no lock). Centred, filling about 80% of the frame, no ground shadow. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, minimal shading, friendly kawaii style; not 3D, not photorealistic. No text, no letters, no numbers, no logos, no watermark, no characters.

### node_current   status: approved (2026-10-10)
- Used in: place card, the level the child plays next
- Purpose: inviting, warm "play me" state (code adds the number and a soft pulse)
- Size and ratio: 1024×1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `node_locked` (approved)
- Save as: `assets/approved/ui/node_current.png`
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached an approved level button. Keep exactly the same shape, size, angle and finish, and change only the colours: a warm amber top (#F3B03A to #FFC32C) with a deeper orange-rose rim (#E1774E), and a soft warm glow around the edge. The top face stays completely empty. Centred, same framing as the attachment, no ground shadow. No text, no letters, no numbers, no symbols, no logos, no watermark, no characters.

### node_completed   status: approved (2026-10-10)
- Used in: place card, finished level (code adds the number and `badge_star`)
- Purpose: "done, replay any time" state (green = done)
- Size and ratio: 1024×1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `node_locked` (approved)
- Save as: `assets/approved/ui/node_completed.png`
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached an approved level button. Keep exactly the same shape, size, angle and finish, and change only the colours: a fresh green top (#8FD18A to #6CC070) with a deeper green rim (#3E9B4F). Green means "done". The top face stays completely empty. Centred, same framing as the attachment, no ground shadow. No text, no letters, no numbers, no symbols, no logos, no watermark, no characters.

### mascot_head_happy   status: approved (2026-10-10)
- Used in: the "I'm Feelio, a friendly AI" chip (Talk screen, onboarding), small avatar buttons, place-card speech line
- Purpose: a small avatar that reads clearly at 32–64 px
- Size and ratio: 1024×1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `OFFICIAL MASCOT`, `mascot_idle` (approved), `FACE: happy`
- Save as: `assets/approved/mascot/mascot_head_happy.png`
- Prompt (paste into ChatGPT):
  > Create an image. I attached the official mascot, an approved pose, and its official happy face. Keep this exact character: same design, proportions, colours, glossy kawaii vector style, antenna with amber orb, dark blue screen face with sparkle eyes, pink cheeks. Show only the head and upper body, from the top of the antenna orb down to just below the screen face (the belly heart is not visible), facing the viewer, centred, filling about 85% of the frame. [FACE: use the attached happy face exactly.] Transparent background PNG (plain white if transparency fails), 1024×1024, no ground shadow, no props, no text, no letters, no other characters. Flat 2D vector-style illustration for a children's mobile game, gentle glossy highlights, friendly kawaii style; not 3D, not photorealistic. No logos, no watermark.

### Priority 2: Milestone 1b reactions and shell states

### mascot_happy   status: approved (2026-10-10)
- Used in: map (place completed), place card, scenario feedback later
- Purpose: warm happiness, calmer than excited
- Size and ratio: 1024×1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `OFFICIAL MASCOT`, `mascot_idle` (approved), `FACE: happy`
- Save as: `assets/approved/mascot/mascot_happy.png`
- Prompt (paste into ChatGPT):
  > Create an image. I attached the official mascot, an approved pose of it, and its official happy face. Keep this exact character: same design, proportions, colours, glossy kawaii vector style, antenna with amber orb, dark blue screen face with sparkle eyes, pink cheeks, heart on the belly, stubby arms and feet. Change only the pose and expression: [POSE: standing, arm-flaps lifted slightly outward and open as if saying "yay", body leaning a little to one side] and [FACE: the attached happy face, eyes slightly curved with joy]. Full body, centred, transparent background PNG (plain white if transparency fails), 1024×1024, no ground shadow, no props, no text, no letters, no other characters. Flat 2D vector-style illustration for a children's mobile game, gentle glossy highlights, friendly kawaii style; not 3D, not photorealistic. No logos, no watermark.

### mascot_excited   status: approved (2026-10-13, reviewed by Claude Code; made by a colleague with the OpenAI image tool via Codex)
- Used in: map (tapping the mascot or an unlocked place, new place unlocked)
- Purpose: big positive reaction. Never used in crisis or sad moments (`docs/MASCOT.md`)
- Size and ratio: 1024×1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `OFFICIAL MASCOT`, `mascot_idle` (approved), `FACE: excited`
- Save as: `assets/approved/mascot/mascot_excited.png`
- Prompt (paste into ChatGPT):
  > Create an image. I attached the official mascot, an approved pose of it, and its official excited face. Keep this exact character: same design, proportions, colours, glossy kawaii vector style, antenna with amber orb, dark blue screen face with sparkle eyes, pink cheeks, heart on the belly, stubby arms and feet. Change only the pose and expression: [POSE: a small happy hop with both feet just off the ground, both arm-flaps raised high, antenna bouncing] and [FACE: the attached excited face exactly: big sparkle eyes and an open smile]. Full body, centred, transparent background PNG (plain white if transparency fails), 1024×1024, no ground shadow, no motion lines, no confetti, no props, no text, no letters, no other characters. Flat 2D vector-style illustration for a children's mobile game, gentle glossy highlights, friendly kawaii style; not 3D, not photorealistic. No logos, no watermark.

### mascot_waving   status: approved (2026-10-10)
- Used in: hello at app start and onboarding; goodbye at the end of a session or when the time limit is reached (warm, never pleading)
- Purpose: greeting and farewell
- Size and ratio: 1024×1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `OFFICIAL MASCOT`, `mascot_idle` (approved), `FACE: happy`
- Save as: `assets/approved/mascot/mascot_waving.png`
- Prompt (paste into ChatGPT):
  > Create an image. I attached the official mascot, an approved pose of it, and its official happy face. Keep this exact character: same design, proportions, colours, glossy kawaii vector style, antenna with amber orb, dark blue screen face with sparkle eyes, pink cheeks, heart on the belly, stubby arms and feet. Change only the pose and expression: [POSE: waving hello with one arm-flap raised high above its side, the other arm-flap relaxed, body tilted slightly toward the raised arm] and [FACE: the attached happy face, friendly and calm]. Full body, centred, transparent background PNG (plain white if transparency fails), 1024×1024, no ground shadow, no props, no text, no letters, no other characters. Flat 2D vector-style illustration for a children's mobile game, gentle glossy highlights, friendly kawaii style; not 3D, not photorealistic. No logos, no watermark.

### mascot_idle_blink   status: approved (2026-10-10)
- Used in: idle loop everywhere (swapped in for about 150 ms every few seconds)
- Purpose: makes the idle mascot feel alive without drawing in code
- Size and ratio: 1024×1024 square, **pixel-aligned with `mascot_idle`**
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `mascot_idle` (approved)
- Save as: `assets/approved/mascot/mascot_idle_blink.png`
- Prompt (paste into ChatGPT):
  > Edit the attached image. Keep everything exactly identical (same character, same pose, same size, same position in the frame, same colours and highlights) and change only the eyes on the screen face: both eyes gently closed, drawn as soft downward-curved lines in the same dark navy, like a blink. The smile and cheeks stay the same. Transparent background PNG (plain white if transparency fails), 1024×1024. No text, no letters, no other changes.

### ring_current   status: approved (2026-10-10)
- Used in: global map, under the current place (code adds a slow pulse), and around the current level node
- Purpose: marks "you are here" softly
- Size and ratio: 1024×1024 square
- Background: transparent PNG, **transparent centre**
- Upload with the prompt: `MAP H`, `badge_star` (approved)
- Save as: `assets/approved/ui/ring_current.png`
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached our game map and an approved badge for style. A single soft glowing ring lying flat on the ground, seen from slightly above at the same camera angle as the map (so it looks like a wide oval), made of a warm amber-to-rose glow (#F3B03A to #C4557C) with a few tiny four-point sparkles in lilac (#CEB0FF) along it. The middle of the ring is completely empty and transparent. Centred, filling about 85% of the frame width. Flat 2D vector-style illustration for a children's mobile game, soft gradients, gentle glow; not 3D, not photorealistic. No text, no letters, no numbers, no logos, no watermark, no characters.

### mascot_sleeping   status: approved (2026-10-10)
- Used in: offline state of the PWA, "come back tomorrow" when the daily time is used up (calm, not sad)
- Purpose: a restful, positive "resting now" state
- Size and ratio: 1024×1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `OFFICIAL MASCOT`, `mascot_idle` (approved)
- Save as: `assets/approved/mascot/mascot_sleeping.png`
- Prompt (paste into ChatGPT):
  > Create an image. I attached the official mascot and an approved pose of it. Keep this exact character: same design, proportions, colours, glossy kawaii vector style, antenna with amber orb, dark blue screen face, pink cheeks, heart on the belly, stubby arms and feet. Change only the pose and expression: [POSE: sitting down peacefully, body slightly slumped and relaxed, arm-flaps resting on its belly, antenna drooping gently] and [FACE: eyes closed as soft curved lines, a tiny peaceful smile, cheeks a little rosier, looking content and cosy, not sad]. Full body, centred, transparent background PNG (plain white if transparency fails), 1024×1024, no ground shadow, no pillow, no blanket, no "Z" letters, no props, no text, no letters, no other characters. Flat 2D vector-style illustration for a children's mobile game, gentle glossy highlights, friendly kawaii style; not 3D, not photorealistic. No logos, no watermark.

### mascot_confused   status: approved (2026-10-10)
- Used in: error states with a retry button (something went wrong; never the child's fault)
- Purpose: a light, kind "hmm, let's try again" face
- Size and ratio: 1024×1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `OFFICIAL MASCOT`, `mascot_idle` (approved)
- Save as: `assets/approved/mascot/mascot_confused.png`
- Prompt (paste into ChatGPT):
  > Create an image. I attached the official mascot and an approved pose of it. Keep this exact character: same design, proportions, colours, glossy kawaii vector style, antenna with amber orb, dark blue screen face with sparkle eyes, pink cheeks, heart on the belly, stubby arms and feet. Change only the pose and expression: [POSE: head and body tilted to one side, one arm-flap raised to the side of the screen face as if scratching its head, antenna bent into a gentle curve] and [FACE: one eyebrow raised, eyes looking up and to the side, a small wavy mouth; puzzled but cheerful, not worried]. Full body, centred, transparent background PNG (plain white if transparency fails), 1024×1024, no ground shadow, no question marks, no symbols, no props, no text, no letters, no other characters. Flat 2D vector-style illustration for a children's mobile game, gentle glossy highlights, friendly kawaii style; not 3D, not photorealistic. No logos, no watermark.

### Priority 2b: the four official feelings on the idle pose (added 2026-10-10)
> `mascot_idle` already wears the official **happy** face, so it doubles as `mascot_feel_happy`. These three complete the set.
> **Usage rule:** these faces are for naming feelings. The angry face is never used as Feelio reacting to the child (MASCOT.md).

### mascot_feel_excited   status: approved (2026-10-10)
- Used in: feelings check-in on the Talk screen ("How are you feeling?"), scenario feeling choices ("How might Sami feel?"), My collection
- Purpose: Feelio in the calm idle pose wearing the official **excited** face, so a child can see and name the feeling
- Size and ratio: same canvas as `mascot_idle` (1254×1254), **pixel-aligned with `mascot_idle`** (only the screen face differs)
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `mascot_idle` (approved), `FACE: excited` (`brand/feelings-expressions/png/face_excited.png`)
- Save as: `assets/approved/mascot/mascot_feel_excited.png`
- Prompt (paste into ChatGPT):
  > Edit the first attached image. Keep everything exactly identical (same character, same pose, same body, arms, feet, antenna, belly heart, colours, highlights, same size and same position in the frame) and change only the face on the dark blue screen: replace it with the face in the second attached image, copied exactly (same eyes, eyebrows, mouth, cheeks). The screen shape and its glossy rim stay as they are. Transparent background PNG (plain white if transparency fails). No text, no letters, no logos, no watermark, no extra characters, no other changes.

### mascot_feel_sad   status: approved (2026-10-10)
- Used in: feelings check-in on the Talk screen ("How are you feeling?"), scenario feeling choices ("How might Sami feel?"), My collection; also the scenario moment when a character feels sad
- Purpose: Feelio in the calm idle pose wearing the official **sad** face, so a child can see and name the feeling
- Size and ratio: same canvas as `mascot_idle` (1254×1254), **pixel-aligned with `mascot_idle`** (only the screen face differs)
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `mascot_idle` (approved), `FACE: sad` (`brand/feelings-expressions/png/face_sad.png`)
- Save as: `assets/approved/mascot/mascot_feel_sad.png`
- Prompt (paste into ChatGPT):
  > Edit the first attached image. Keep everything exactly identical (same character, same pose, same body, arms, feet, antenna, belly heart, colours, highlights, same size and same position in the frame) and change only the face on the dark blue screen: replace it with the face in the second attached image, copied exactly (same eyes, eyebrows, mouth, cheeks, including the small tears). The screen shape and its glossy rim stay as they are. Transparent background PNG (plain white if transparency fails). No text, no letters, no logos, no watermark, no extra characters, no other changes.

### mascot_feel_angry   status: approved (2026-10-10)
- Used in: feelings check-in on the Talk screen ("How are you feeling?"), scenario feeling choices ("How might Sami feel?"), My collection
- Purpose: Feelio in the calm idle pose wearing the official **angry** face, so a child can see and name the feeling
- Size and ratio: same canvas as `mascot_idle` (1254×1254), **pixel-aligned with `mascot_idle`** (only the screen face differs)
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `mascot_idle` (approved), `FACE: angry` (`brand/feelings-expressions/png/face_angry.png`)
- Save as: `assets/approved/mascot/mascot_feel_angry.png`
- Prompt (paste into ChatGPT):
  > Edit the first attached image. Keep everything exactly identical (same character, same pose, same body, arms, feet, antenna, belly heart, colours, highlights, same size and same position in the frame) and change only the face on the dark blue screen: replace it with the face in the second attached image, copied exactly (same eyes, eyebrows, mouth, cheeks, including the small anger mark above the screen at the top right; keep that mark exactly as in the face image). The screen shape and its glossy rim stay as they are. Transparent background PNG (plain white if transparency fails). No text, no letters, no logos, no watermark, no extra characters, no other changes.

### Priority 3: voice poses of Batch A (Milestone 4; generate in the same sitting if you can)

### mascot_listening   status: approved (2026-10-11)
- Used in: Talk screen, while the child speaks (ElevenLabs mode = listening)
- Purpose: shows "I'm listening to you" clearly to a child who can't read
- Size and ratio: 1024×1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `OFFICIAL MASCOT`, `mascot_idle` (approved)
- Save as: `assets/approved/mascot/mascot_listening.png`
- Prompt (paste into ChatGPT):
  > Create an image. I attached the official mascot and an approved pose of it. Keep this exact character: same design, proportions, colours, glossy kawaii vector style, antenna with amber orb, dark blue screen face with sparkle eyes, pink cheeks, heart on the belly, stubby arms and feet. Change only the pose and expression: [POSE: head and body tilted slightly to one side, one arm-flap raised and cupped near the side of the screen face as if listening carefully, leaning in a little toward the viewer] and [FACE: attentive open sparkle eyes, eyebrows gently raised, a small closed soft smile]. Full body, centred, transparent background PNG (plain white if transparency fails), 1024×1024, no ground shadow, no sound waves, no props, no text, no letters, no other characters. Flat 2D vector-style illustration for a children's mobile game, gentle glossy highlights, friendly kawaii style; not 3D, not photorealistic. No logos, no watermark.

### mascot_thinking   status: approved (2026-10-13, reviewed by Claude Code; made by a colleague with the OpenAI image tool via Codex)
- Used in: Talk screen, between the end of the child's speech and the first reply audio
- Purpose: covers the latency gap with a readable "thinking" state
- Size and ratio: 1024×1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `OFFICIAL MASCOT`, `mascot_idle` (approved)
- Save as: `assets/approved/mascot/mascot_thinking.png`
- Prompt (paste into ChatGPT):
  > Create an image. I attached the official mascot and an approved pose of it. Keep this exact character: same design, proportions, colours, glossy kawaii vector style, antenna with amber orb, dark blue screen face with sparkle eyes, pink cheeks, heart on the belly, stubby arms and feet. Change only the pose and expression: [POSE: standing, one arm-flap raised to touch the bottom edge of its screen face like a hand on the chin, the antenna orb glowing a little brighter] and [FACE: eyes looking up and to the side, a small round "o" mouth, thoughtful and calm]. Full body, centred, transparent background PNG (plain white if transparency fails), 1024×1024, no ground shadow, no thought bubble, no symbols, no props, no text, no letters, no other characters. Flat 2D vector-style illustration for a children's mobile game, gentle glossy highlights, friendly kawaii style; not 3D, not photorealistic. No logos, no watermark.

### mascot_speaking_half   status: approved (2026-10-13, reviewed by Claude Code; made by a colleague with the OpenAI image tool via Codex)
- Used in: Talk screen while the agent speaks; the **base frame** for the three mouth frames (generate this one first)
- Purpose: speaking pose with a half-open mouth
- Size and ratio: 1024×1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `OFFICIAL MASCOT`, `mascot_idle` (approved), `FACE: happy`
- Save as: `assets/approved/mascot/mascot_speaking_half.png`
- Prompt (paste into ChatGPT):
  > Create an image. I attached the official mascot, an approved pose of it, and its official happy face. Keep this exact character: same design, proportions, colours, glossy kawaii vector style, antenna with amber orb, dark blue screen face with sparkle eyes, pink cheeks, heart on the belly, stubby arms and feet. Change only the pose and expression: [POSE: standing facing the viewer, one arm-flap raised a little in a friendly explaining gesture, the other relaxed] and [FACE: warm open sparkle eyes, mouth half open as if in the middle of saying a word]. Full body, centred, transparent background PNG (plain white if transparency fails), 1024×1024, no ground shadow, no speech bubble, no props, no text, no letters, no other characters. Flat 2D vector-style illustration for a children's mobile game, gentle glossy highlights, friendly kawaii style; not 3D, not photorealistic. No logos, no watermark.

### mascot_speaking_closed   status: approved (2026-10-13, owner decision: kept although the body is not pixel-aligned with `mascot_speaking_half`; retrying gave the same result)
- Used in: Talk screen mouth frame at low output volume
- Purpose: lip-sync frame (swapped by audio level in code)
- Size and ratio: 1024×1024 square, **pixel-aligned with `mascot_speaking_half`**
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `mascot_speaking_half` (approved)
- Save as: `assets/approved/mascot/mascot_speaking_closed.png`
- Prompt (paste into ChatGPT):
  > Edit the attached image. Same pose and body as the attached pose image, only the mouth changes: closed, a small soft smile. Keep everything else exactly identical: same size, same position in the frame, same eyes, cheeks, colours and highlights. Transparent background PNG (plain white if transparency fails), 1024×1024. No text, no letters, no other changes.

### mascot_speaking_open   status: approved (2026-10-13, owner decision: kept although the body is not pixel-aligned with `mascot_speaking_half`; retrying gave the same result)
- Used in: Talk screen mouth frame at high output volume
- Purpose: lip-sync frame
- Size and ratio: 1024×1024 square, **pixel-aligned with `mascot_speaking_half`**
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `mascot_speaking_half` (approved)
- Save as: `assets/approved/mascot/mascot_speaking_open.png`
- Prompt (paste into ChatGPT):
  > Edit the attached image. Same pose and body as the attached pose image, only the mouth changes: wide open in a round, happy speaking shape. Keep everything else exactly identical: same size, same position in the frame, same eyes, cheeks, colours and highlights. Transparent background PNG (plain white if transparency fails), 1024×1024. No text, no letters, no other changes.

### Not requested (done in code from delivered or brand files, allowed by the protocol)
- Place thumbnails in the place card: cropped in code from the approved map of the current language.
- Dock tiles, sheet and card backgrounds, speech bubbles, the Play button: flat brand colours and shapes in code. Functional icons (back, close, settings, mic, play) come from one icon library.
- PWA app icon: the brand's simplified mascot outline (`brand/mini-logo-icon.svg`) on a flat lilac tile.
- Locked-place dimming: CSS filter on the delivered map plus `badge_lock`.

---

## Batch 2 (onboarding "Arriving in Feelio's world" + the child's avatar), written 2026-10-10, **awaiting owner approval of docs/ONBOARDING.md**

Generate **after** approving the plan. Five groups, **one ChatGPT chat per group**, in this order. New folder: `assets/approved/avatar/`.

| Order | Group | Files | Why first |
|---|---|---|---|
| 1 | Avatar base designs | 3 | Decides the whole character concept: approve these before the 21 variants |
| 2 | Welcome meadow scenes | 2 | Every onboarding stop happens here |
| 3 | Onboarding objects | 6 | Name sign (AI disclosure), say-bubble, grown-up door, mic, open-gate scene edits ×2 (paint pots no longer needed, D-053) |
| 4 | Character colours | 3 | `bun` in rose, lilac and sky (D-053: one character, one pose) |
| 5 | "What do you like?" pictures, plus `mascot_pointing` | 9 | |

### Group 1: avatar base designs (one chat)
> These are the **child's own character**: a small creature, NOT the mascot (no antenna, no screen face, no belly heart, so it never looks like an AI) and NOT a human child (safety, D-015). Front view and **symmetric** (the app may flip it to face the walking direction).

### avatar_bun_amber_idle   status: approved (2026-10-10, after one redo)
- Used in: Onboarding stop 2 (choose your character); map, Talk, stories, collection (ONBOARDING.md §5)
- Purpose: Base design of the 'bun' character shape (amber); every other bun variant is an edit of this image
- Size and ratio: 1024x1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `avatar_bean_amber_idle` (approved; match its outline and finish), `OFFICIAL MASCOT` (style reference only)
- Redo reason: a wide whitish glow/halo around the whole edge (rejection checklist), and no outline, so it did not match bean and puff. Keep the design itself (round bun, little round ears).
- Save as: assets/approved/avatar/avatar_bun_amber_idle.png
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached an approved character (match its thin darker-orange outline, glossy finish, eye style and proportions of face to body) and our mascot only as a STYLE reference (same glossy kawaii vector finish, same soft lighting from the top-left, same level of detail). Draw a DIFFERENT, new character: a small round, soft, bun-shaped creature, almost a ball, slightly wider than tall, with two tiny rounded ears on top. Simple face drawn directly on the body: two big round dark eyes with small white sparkle highlights, a small happy smile, rosy pink cheeks. Tiny stubby arms and two round feet. Body colour warm amber #F3B03A with a soft lighter highlight on the upper left and gentle deeper shading at the bottom. IMPORTANT, it must NOT look like the attached mascot: no antenna, no orb, no screen or visor on the face, no heart on the belly, no gradient to purple. Standing calmly, facing the viewer, perfectly symmetric left and right. Full body, centred, filling about 75% of the frame, no ground shadow, no props. Crisp, clean edges: NO glow, NO halo, NO soft light around the outside of the character, NO blur at the edges; a thin darker-orange outline all the way round like the attached character. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters.

### avatar_bean_amber_idle   status: approved (2026-10-10)
- Used in: Onboarding stop 2 (choose your character); map, Talk, stories, collection (ONBOARDING.md §5)
- Purpose: Base design of the 'bean' character shape (amber); every other bean variant is an edit of this image
- Size and ratio: 1024x1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `OFFICIAL MASCOT` (style reference only)
- Save as: assets/approved/avatar/avatar_bean_amber_idle.png
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached our mascot only as a STYLE reference (same glossy kawaii vector finish, same soft lighting from the top-left, same level of detail). Draw a DIFFERENT, new character: a small, gently rounded bean-shaped creature, a bit taller than wide, with two little soft leaf-like tufts on top of its head. Simple face drawn directly on the body: two big round dark eyes with small white sparkle highlights, a small happy smile, rosy pink cheeks. Tiny stubby arms and two round feet. Body colour warm amber #F3B03A with a soft lighter highlight on the upper left and gentle deeper shading at the bottom. IMPORTANT, it must NOT look like the attached mascot: no antenna, no orb, no screen or visor on the face, no heart on the belly, no gradient to purple. Standing calmly, facing the viewer, perfectly symmetric left and right. Full body, centred, filling about 75% of the frame, no ground shadow, no props. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters.

### avatar_puff_amber_idle   status: approved (2026-10-10)
- Used in: Onboarding stop 2 (choose your character); map, Talk, stories, collection (ONBOARDING.md §5)
- Purpose: Base design of the 'puff' character shape (amber); every other puff variant is an edit of this image
- Size and ratio: 1024x1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `OFFICIAL MASCOT` (style reference only)
- Save as: assets/approved/avatar/avatar_puff_amber_idle.png
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached our mascot only as a STYLE reference (same glossy kawaii vector finish, same soft lighting from the top-left, same level of detail). Draw a DIFFERENT, new character: a small fluffy cloud-puff creature with a soft scalloped outline like a little cloud, chubby and round. Simple face drawn directly on the body: two big round dark eyes with small white sparkle highlights, a small happy smile, rosy pink cheeks. Tiny stubby arms and two round feet. Body colour warm amber #F3B03A with a soft lighter highlight on the upper left and gentle deeper shading at the bottom. IMPORTANT, it must NOT look like the attached mascot: no antenna, no orb, no screen or visor on the face, no heart on the belly, no gradient to purple. Standing calmly, facing the viewer, perfectly symmetric left and right. Full body, centred, filling about 75% of the frame, no ground shadow, no props. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters.

### Group 2: welcome meadow scenes (one chat)

### scene_meadow_land   status: approved (2026-10-10)
- Used in: Onboarding (all 5 stops)
- Purpose: The welcome meadow where the child arrives and makes their character
- Size and ratio: 1536x1024 landscape
- Background: none (full scene, opaque)
- Upload with the prompt: `MAP H`
- Save as: assets/approved/world/scene_meadow_land.png
- Prompt (paste into ChatGPT):
  > Create an image. Wide 3:2 landscape scene. I attached our approved game map: match its art style, colours, camera angle (soft three-quarter top-down), lighting from the top-left and level of detail exactly. A sunny, calm welcome meadow: soft green grass with a few flowers and small bushes near the edges, a pale lilac sky with two or three soft white clouds at the top. A short, wide, light-beige path starts at the bottom centre and leads straight up the middle to a closed friendly wooden garden gate at the back centre, with a low hedge on either side of the gate. The left and right halves of the meadow are open, flat and EMPTY (big free space for characters to stand), and the composition is balanced and nearly symmetric. No buildings, no signs, no people, no animals, no characters. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters. No people.

### scene_meadow_port   status: approved (2026-10-10)
- Used in: Onboarding (all 5 stops)
- Purpose: The welcome meadow where the child arrives and makes their character
- Size and ratio: 1024x1536 portrait
- Background: none (full scene, opaque)
- Upload with the prompt: `MAP V`, plus `scene_meadow_land` (approved)
- Save as: assets/approved/world/scene_meadow_port.png
- Prompt (paste into ChatGPT):
  > Create an image. Tall 2:3 portrait scene. I attached our approved game map: match its art style, colours, camera angle (soft three-quarter top-down), lighting from the top-left and level of detail exactly. A sunny, calm welcome meadow: soft green grass with a few flowers and small bushes near the edges, a pale lilac sky with two or three soft white clouds at the top. A short, wide, light-beige path starts at the bottom centre and leads straight up the middle to a closed friendly wooden garden gate at the back centre, with a low hedge on either side of the gate. The left and right halves of the meadow are open, flat and EMPTY (big free space for characters to stand), and the composition is balanced and nearly symmetric. No buildings, no signs, no people, no animals, no characters. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters. No people.

### Group 3: onboarding objects (one chat; upload `dock_map` (approved) each time for the icon style)

### ui_sign_plate   status: approved (2026-10-11)
- Used in: The AI name sign at stop 1 ('I'm Feelio, a friendly AI', written by code); the child's name sign; place names
- Purpose: A blank wooden sign the code writes on
- Size and ratio: 1536x1024 landscape
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `MAP H` (copy its wooden signs), `dock_map` (approved)
- Save as: assets/approved/ui/ui_sign_plate.png
- Prompt (paste into ChatGPT):
  > Create an image. Wide 3:2 landscape, transparent background. I attached an approved game icon; match its style, outline and glossy finish. A single friendly wooden sign seen from the front, exactly like the wooden signs on the attached map (same wood colour, same rounded plank shape, same posts), but wide and completely BLANK: a clean, smooth, light wooden board with nothing written on it, on two short posts. Centred, filling about 85% of the frame width, no ground shadow. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters.

### ui_say_bubble   status: approved (2026-10-11)
- Used in: What the mascot says (caption + audio)
- Purpose: A blank speech bubble frame
- Size and ratio: 1536x1024 landscape
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `dock_map` (approved)
- Save as: assets/approved/ui/ui_say_bubble.png
- Prompt (paste into ChatGPT):
  > Create an image. Wide 3:2 landscape, transparent background. I attached an approved game icon; match its style, outline and glossy finish. A single big, soft, rounded speech bubble, like a cloud-shaped balloon, cream-white (#FFFDF7) inside with a smooth dark navy (#322A6A) outline of even thickness, and a short rounded tail pointing straight DOWN from the bottom centre. The inside is completely empty. Flat, no gradient inside, no shadow. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters.

### ui_grownup_door   status: approved (2026-10-11)
- Used in: Child screens, top corner: press and hold to go to the grown-up area
- Purpose: A small door that clearly means 'for grown-ups'
- Size and ratio: 1024x1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `dock_map` (approved)
- Save as: assets/approved/ui/ui_grownup_door.png
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached an approved game icon; match its style, outline and glossy finish. A single small cosy wooden door with a round top, a little golden key hanging from a hook beside it and a tiny round window, soft purple (#614194) door frame. Chunky and simple, easy to recognise at 64 px. Centred, filling about 80% of the frame, no ground shadow. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters.

### ui_mic_object   status: approved (2026-10-13; the 2026-10-11 redo reason, reading as a trophy, is fixed)
- Used in: Onboarding stop 4 and the Talk screen: the big friendly microphone
- Purpose: A tappable microphone object
- Size and ratio: 1024x1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `dock_map` (approved)
- Save as: assets/approved/ui/ui_mic_object.png
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached an approved game icon; match its style, outline and glossy finish. A single chunky, friendly microphone like a toy: a round soft-lilac (#EFCFF8) mesh head with a purple (#614194) band and a short rounded amber (#F3B03A) handle, standing upright on a small round base. Glossy highlight on the upper left. No face. Centred, filling about 75% of the frame, no ground shadow. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters.
- **Redo prompt (2026-10-11)**, upload `dock_talk` (approved):
  > Create an image. Square 1:1, transparent background. I attached an approved game icon; match its style, outline and glossy finish. A single chunky, friendly HANDHELD microphone, the classic singer's microphone shape everyone recognises: a big round soft-lilac (#EFCFF8) mesh ball on top, a purple (#614194) ring band under the ball, and one straight, slim, rounded amber (#F3B03A) handle going straight down from it, tilted about 15 degrees to the right. IMPORTANT: no stand, no base, no side handles, no cup shape; it must not look like a trophy. Glossy highlight on the upper left of the ball. No face. Centred, filling about 75% of the frame, no ground shadow. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters.

### scene_meadow_land_open   status: approved (2026-10-11)
- Used in: Onboarding stop 5 (the gate opens; the app reveals only the gate area over the closed scene, so small drift elsewhere does not show)
- Purpose: the same meadow with the gate open
- Size and ratio: 1536x1024 landscape
- Background: none (full scene, opaque)
- Upload with the prompt: `scene_meadow_land` (approved)
- Save as: assets/approved/world/scene_meadow_land_open.png
- Prompt (paste into ChatGPT):
  > Edit the attached image. Keep everything exactly identical (same size, composition, path, grass, flowers, trees, sky, colours, art style, the stone gate pillars) and change only the two wooden gate doors: swing them wide open inwards, so through the open gateway we see a soft warm golden glow of light and a hint of green hills. Do not move, add or remove anything else. No text, no letters, no logos, no watermark, no people, no characters.

### scene_meadow_port_open   status: approved (2026-10-11)
- Used in: Onboarding stop 5 (the gate opens; the app reveals only the gate area over the closed scene, so small drift elsewhere does not show)
- Purpose: the same meadow with the gate open
- Size and ratio: 1024x1536 portrait
- Background: none (full scene, opaque)
- Upload with the prompt: `scene_meadow_port` (approved)
- Save as: assets/approved/world/scene_meadow_port_open.png
- Prompt (paste into ChatGPT):
  > Edit the attached image. Keep everything exactly identical (same size, composition, path, grass, flowers, trees, sky, colours, art style, the stone gate pillars) and change only the two wooden gate doors: swing them wide open inwards, so through the open gateway we see a soft warm golden glow of light and a hint of green hills. Do not move, add or remove anything else. No text, no letters, no logos, no watermark, no people, no characters.

### ui_paint_pot_amber   status: not needed (D-053: the child picks the character's colour directly)
- Used in: Onboarding stop 2: choose a colour
- Purpose: A paint pot; the other three colours are edits of it
- Size and ratio: 1024x1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `dock_map` (approved)
- Save as: assets/approved/ui/ui_paint_pot_amber.png
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached an approved game icon; match its style. A single small chunky paint pot seen from the front, slightly from above, open, full of thick glossy amber (#F3B03A) paint with one round drip running down the side. Pot body light cream with a navy (#322A6A) rim. Centred, filling about 75% of the frame, no ground shadow, no brush. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters.

### ui_paint_pot_rose   status: not needed (D-053: the child picks the character's colour directly)
- Used in: Onboarding stop 2: choose a colour
- Purpose: Paint pot, rose
- Size and ratio: 1024x1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `ui_paint_pot_amber` (approved)
- Save as: assets/approved/ui/ui_paint_pot_rose.png
- Prompt (paste into ChatGPT):
  > Edit the attached image. Keep everything exactly identical (pot, rim, size, position, drip shape) and change only the paint colour to soft rose #E0729A, with a matching glossy highlight. No text, no letters, no numbers, no logos, no watermark, no extra characters.

### ui_paint_pot_lilac   status: not needed (D-053: the child picks the character's colour directly)
- Used in: Onboarding stop 2: choose a colour
- Purpose: Paint pot, lilac
- Size and ratio: 1024x1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `ui_paint_pot_amber` (approved)
- Save as: assets/approved/ui/ui_paint_pot_lilac.png
- Prompt (paste into ChatGPT):
  > Edit the attached image. Keep everything exactly identical (pot, rim, size, position, drip shape) and change only the paint colour to soft lilac #B79AE6, with a matching glossy highlight. No text, no letters, no numbers, no logos, no watermark, no extra characters.

### ui_paint_pot_sky   status: not needed (D-053: the child picks the character's colour directly)
- Used in: Onboarding stop 2: choose a colour
- Purpose: Paint pot, sky
- Size and ratio: 1024x1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `ui_paint_pot_amber` (approved)
- Save as: assets/approved/ui/ui_paint_pot_sky.png
- Prompt (paste into ChatGPT):
  > Edit the attached image. Keep everything exactly identical (pot, rim, size, position, drip shape) and change only the paint colour to sky blue #79B1DE, with a matching glossy highlight. No text, no letters, no numbers, no logos, no watermark, no extra characters.

### Group 4: character colours (only 3 files; one chat; each is an EDIT of the approved `bun`)
> **Owner decision 2026-10-10 (D-053): one character for now (`bun`), four colours, no cheer pose** (the "yay" is a code hop). The approved `bean` and `puff` bases are kept for later but not used. Paint pots are not needed: the child taps the character in each colour.

Upload `avatar_bun_amber_idle` (approved) and paste, replacing COLOUR:
> Edit the attached image. Keep the character exactly identical (shape, ears, face, eyes, cheeks, arms, feet, outline, size, position in the frame, highlights and shading style) and change only the body colour to COLOUR, with a matching lighter highlight on the upper left, slightly deeper shading at the bottom and a matching slightly darker outline. Transparent background PNG (plain white if transparency fails). No text, no letters, no logos, no watermark, no extra characters.

| Save as (`assets/approved/avatar/`) | COLOUR |
|---|---|
| `avatar_bun_rose_idle.png` | soft rose #E0729A |
| `avatar_bun_lilac_idle.png` | soft lilac #B79AE6 |
| `avatar_bun_sky_idle.png` | sky blue #79B1DE |

### Group 5: "What do you like?" pictures + one mascot pose (one chat; upload `dock_map` (approved) each time)

### like_animals   status: approved (2026-10-11)
- Used in: Onboarding stop 3 (what do you like?); later story suggestions
- Purpose: Picture choice: animals
- Size and ratio: 1024x1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `dock_map` (approved)
- Save as: assets/approved/ui/like_animals.png
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached an approved game icon; match its style, outline and glossy finish exactly. A single chunky icon picture: a friendly cartoon puppy and kitten sitting side by side. Bold, simple, big shapes, easy to recognise at 96 px. Centred, filling about 80% of the frame, no tile behind it, no ground shadow. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters. No people.

### like_space   status: approved (2026-10-11)
- Used in: Onboarding stop 3 (what do you like?); later story suggestions
- Purpose: Picture choice: space
- Size and ratio: 1024x1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `dock_map` (approved)
- Save as: assets/approved/ui/like_space.png
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached an approved game icon; match its style, outline and glossy finish exactly. A single chunky icon picture: a small rounded rocket next to a ringed planet and two little stars. Bold, simple, big shapes, easy to recognise at 96 px. Centred, filling about 80% of the frame, no tile behind it, no ground shadow. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters. No people.

### like_music   status: approved (2026-10-11)
- Used in: Onboarding stop 3 (what do you like?); later story suggestions
- Purpose: Picture choice: music
- Size and ratio: 1024x1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `dock_map` (approved)
- Save as: assets/approved/ui/like_music.png
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached an approved game icon; match its style, outline and glossy finish exactly. A single chunky icon picture: a round drum with two drumsticks and a small xylophone. Bold, simple, big shapes, easy to recognise at 96 px. Centred, filling about 80% of the frame, no tile behind it, no ground shadow. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters. No people.

### like_drawing   status: approved (2026-10-11)
- Used in: Onboarding stop 3 (what do you like?); later story suggestions
- Purpose: Picture choice: drawing
- Size and ratio: 1024x1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `dock_map` (approved)
- Save as: assets/approved/ui/like_drawing.png
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached an approved game icon; match its style, outline and glossy finish exactly. A single chunky icon picture: three chunky crayons and a sheet of paper with a simple rainbow drawn on it. Bold, simple, big shapes, easy to recognise at 96 px. Centred, filling about 80% of the frame, no tile behind it, no ground shadow. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters. No people.

### like_ballgames   status: approved (2026-10-11)
- Used in: Onboarding stop 3 (what do you like?); later story suggestions
- Purpose: Picture choice: ballgames
- Size and ratio: 1024x1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `dock_map` (approved)
- Save as: assets/approved/ui/like_ballgames.png
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached an approved game icon; match its style, outline and glossy finish exactly. A single chunky icon picture: a classic soccer ball and a small basketball side by side. Bold, simple, big shapes, easy to recognise at 96 px. Centred, filling about 80% of the frame, no tile behind it, no ground shadow. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters. No people.

### like_nature   status: approved (2026-10-11)
- Used in: Onboarding stop 3 (what do you like?); later story suggestions
- Purpose: Picture choice: nature
- Size and ratio: 1024x1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `dock_map` (approved)
- Save as: assets/approved/ui/like_nature.png
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached an approved game icon; match its style, outline and glossy finish exactly. A single chunky icon picture: a flower pot with a sprouting plant, a big leaf and a ladybird. Bold, simple, big shapes, easy to recognise at 96 px. Centred, filling about 80% of the frame, no tile behind it, no ground shadow. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters. No people.

### like_blocks   status: approved (2026-10-11)
- Used in: Onboarding stop 3 (what do you like?); later story suggestions
- Purpose: Picture choice: blocks
- Size and ratio: 1024x1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `dock_map` (approved)
- Save as: assets/approved/ui/like_blocks.png
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached an approved game icon; match its style, outline and glossy finish exactly. A single chunky icon picture: a small tower of chunky colourful building blocks. Bold, simple, big shapes, easy to recognise at 96 px. Centred, filling about 80% of the frame, no tile behind it, no ground shadow. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters. No people.

### like_sea   status: approved (2026-10-11)
- Used in: Onboarding stop 3 (what do you like?); later story suggestions
- Purpose: Picture choice: sea
- Size and ratio: 1024x1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `dock_map` (approved)
- Save as: assets/approved/ui/like_sea.png
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached an approved game icon; match its style, outline and glossy finish exactly. A single chunky icon picture: a friendly round fish, a curling wave and a seashell. Bold, simple, big shapes, easy to recognise at 96 px. Centred, filling about 80% of the frame, no tile behind it, no ground shadow. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters. No people.

### mascot_pointing   status: approved (2026-10-11)
- Used in: Onboarding stops 1–3 ('look over here!'); place card
- Purpose: Feelio points at the choices (from Batch B)
- Size and ratio: 1024x1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `OFFICIAL MASCOT`, `mascot_idle` (approved)
- Save as: assets/approved/mascot/mascot_pointing.png
- Prompt (paste into ChatGPT):
  > Create an image. I attached the official mascot and an approved pose of it. Keep this exact character: same design, proportions, colours, glossy kawaii vector style, antenna with amber orb, dark blue screen face with sparkle eyes, pink cheeks, heart on the belly, stubby arms and feet. Change only the pose and expression: [POSE: standing turned slightly to the side, one arm-flap stretched out pointing to the side, the other relaxed] and [FACE: bright, encouraging eyes looking in the pointing direction, small open smile]. Full body, centred, transparent background PNG (plain white if transparency fails), 1024×1024, no ground shadow, no props, no text, no letters, no other characters. Flat 2D vector-style illustration for a children's mobile game, gentle glossy highlights, friendly kawaii style; not 3D, not photorealistic. No logos, no watermark.

---

---

## Batch 3 (level flow: place maps, level icons, loading and celebration), written 2026-10-11 (D-056, D-057)

What it is for: `docs/LEVEL_FLOW.md` (§6 lists every asset with its purpose, style, format and screen). Until each file is approved the app uses a stand-in or leaves it out, as that document says; nothing is drawn in code.
New folders: `assets/approved/place/` (place maps and arrival pictures) and `assets/approved/level/` (level icons).

| Order | Group (one ChatGPT chat each) | Files | Priority |
|---|---|---|---|
| 1 | Home place maps | 2 | **P1**: Home opens its own map today (a grey placeholder until then) |
| 2 | Level states and celebration | 2 | **P1**: `node_in_progress`, `ui_celebrate_burst` |
| 3 | Home arrival picture + Home level icons | 6 | **P1** |
| 4 | Mascot "still being made" pose | 1 | P1 (`mascot_making`) |
| 5 | Park, School, Club, Market place maps | 8 | P2 (each place opens only after the one before) |
| 6 | Their arrival pictures and level icons | 24 | P2 |

**After a place map is delivered** Claude Code measures where its 5 stones are (as for the world map, D-054), writes them into `world.json` and sets `map.<orientation>.provisional` to false. So the map art needs **5 clear, empty round stone pads along a path**, nothing more precise.

### Group 1: Home place maps (one chat)
### place_home_map_h   status: approved (2026-10-11): soft transparent edge fade, shown over its edge colour #ca9e76; stones measured
- Used in: Place map of Home (landscape): `/place/home`
- Purpose: The Home's own map; its 5 level stones sit on the pads
- Size and ratio: 1536x1024 landscape
- Background: none (full scene, opaque)
- Upload with the prompt: `MAP H`
- Save as: `assets/approved/place/place_home_map_h.png`
- Prompt (paste into ChatGPT):
  > Create an image. Wide 3:2 landscape game map, opaque (no transparency needed). I attached our approved world map: match its art style, colours, camera angle (soft three-quarter top-down), lighting from the top-left and level of detail exactly. This is the inside map of one place, the Home: a cosy family house with a garden, seen from above: the front door with a doormat, a dining table visible on a sunny patio, a small toy corner on a rug under a tree, a bedroom window with curtains, and a garden gate leading out to the lawn. A single wide, smooth light-beige path enters at the middle of the left edge and leaves at the middle of the right edge, winding gently up and down. Along the path are exactly 5 large, flat, EMPTY round stone pads (the same stone pads as on the attached map), evenly spaced, with nothing standing on them and open space around each pad. Leave a calm, mostly plain strip at the very top for a name sign. No people, no animals, no characters. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters.

### place_home_map_v   status: approved (2026-10-13; portrait, the inside of the house; stones measured)
- Used in: Place map of Home (portrait): `/place/home`
- Purpose: The Home's own map; its 5 level stones sit on the pads
- Size and ratio: 1024x1536 portrait
- Background: none (full scene, opaque)
- Upload with the prompt: `MAP V`
- Save as: `assets/approved/place/place_home_map_v.png`
- Prompt (paste into ChatGPT):
  > Create an image. Tall 2:3 portrait game map, opaque (no transparency needed). I attached our approved world map: match its art style, colours, camera angle (soft three-quarter top-down), lighting from the top-left and level of detail exactly. This is the inside map of one place, the Home: a cosy family house with a garden, seen from above: the front door with a doormat, a dining table visible on a sunny patio, a small toy corner on a rug under a tree, a bedroom window with curtains, and a garden gate leading out to the lawn. A single wide, smooth light-beige path enters at the middle of the bottom edge and leaves at the middle of the top edge, winding gently left and right. Along the path are exactly 5 large, flat, EMPTY round stone pads (the same stone pads as on the attached map), evenly spaced, with nothing standing on them and open space around each pad. Leave a calm, mostly plain strip at the very top for a name sign. No people, no animals, no characters. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters.
- **Redo prompt (2026-10-11)**, upload the approved `place_home_map_h` (assets/approved/place/place_home_map_h.png) and `MAP V`:
  > Create an image. TALL PORTRAIT 2:3, exactly 1024x1536 (taller than wide), opaque, no transparency needed. I attached two images: first, our approved landscape map of the inside of the Home; second, our approved tall world map. Make the TALL version of the first image: the same cosy house INTERIOR seen from above, same art style, colours, warm wooden floor, soft three-quarter top-down camera and lighting from the top-left. Keep the same rooms and objects, rearranged to fit a tall frame: the dining table with chairs, the front door with a doormat, the bedroom with the bed, the toy corner on a purple rug with a teddy bear, the living room with the blue sofa. A single wide, smooth light-beige path enters at the middle of the bottom edge and leaves at the middle of the top edge, winding gently left and right. Along the path are exactly 5 large, flat, EMPTY round stone pads, identical to the pads on the first image, evenly spaced from bottom to top, with nothing standing on them and open floor around each pad. Leave a calm, mostly plain strip at the very top for a name sign. Not the outside of the house, no garden, no lawn. No people, no animals, no characters. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters.

### Group 2: level states and celebration (one chat)

### node_in_progress   status: approved (2026-10-11)
- Used in: Place maps and the celebration progress row: a level that was started but not finished
- Purpose: The fourth level state (in progress), between available (amber) and completed (green)
- Size and ratio: 1024x1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `node_current` (approved), `node_completed` (approved)
- Save as: `assets/approved/ui/node_in_progress.png`
- Prompt (paste into ChatGPT):
  > Edit the first attached image (the amber level stone). Keep the stone exactly identical in shape, size, position, outline and glossy style. Change only the colours: the left half of the top face stays warm amber, the right half becomes the soft green of the second attached stone, with a smooth soft blend in the middle, like a stone that is half done. Transparent background PNG (plain white if transparency fails). No text, no letters, no numbers, no logos, no watermark, no extra characters.

### ui_celebrate_burst   status: approved (2026-10-11)
- Used in: Celebration after a level: behind the big star, slowly turning
- Purpose: A soft, happy burst of light that makes the moment feel special without being loud
- Size and ratio: 1024x1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `badge_star` (approved, for style)
- Save as: `assets/approved/ui/ui_celebrate_burst.png`
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached an approved star icon; match its style. A soft round burst of gentle light rays around an EMPTY centre (the star will sit there): 12 rounded rays alternating pale amber #FFE6BA and pale rose #FFD8E6, with a few small four-point sparkles in lilac and amber between them. Calm and soft, not neon, no glow halo around the outside, crisp edges. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters.

### Group 3: Home arrival picture and Home level icons (one chat)

### loading_place_home   status: approved (2026-10-11)
- Used in: Loading scene while the Home map opens (above the hopping mascot)
- Purpose: Shows the child where they are going while the Home loads
- Size and ratio: 1024x1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `MAP H` (style), `dock_map` (approved, icon finish)
- Save as: `assets/approved/place/loading_place_home.png`
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached our approved map and an approved icon; match their style. A single friendly object picture, centred, filling about 80% of the frame, no scene and no background shape: a friendly front door of a cosy house: a rounded wooden door with a small round window, a doormat, two flower pots on either side and a little porch light. Welcoming and calm. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters. No people.

### level_home_1   status: approved (2026-10-11)
- Used in: Home place map, above level 1's stone ("Leaving for school")
- Purpose: Shows what level 1 is about, so a child who can't read can recognise it
- Size and ratio: 1024x1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `dock_map` (approved), and the first approved icon of this group once there is one
- Save as: `assets/approved/level/level_home_1.png`
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached an approved icon; match its style exactly. A single game icon object, centred, filling about 80% of the frame, no tile or background shape: a small school backpack leaning against a rounded front door. Chunky, rounded, easy to read at small size. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters. No people.

### level_home_2   status: approved (2026-10-11)
- Used in: Home place map, above level 2's stone ("Family talks at the table")
- Purpose: Shows what level 2 is about, so a child who can't read can recognise it
- Size and ratio: 1024x1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `dock_map` (approved), and the first approved icon of this group once there is one
- Save as: `assets/approved/level/level_home_2.png`
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached an approved icon; match its style exactly. A single game icon object, centred, filling about 80% of the frame, no tile or background shape: a round family dining table with four bowls and a jug of water. Chunky, rounded, easy to read at small size. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters. No people.

### level_home_3   status: approved (2026-10-11)
- Used in: Home place map, above level 3's stone ("Sharing with a brother or sister")
- Purpose: Shows what level 3 is about, so a child who can't read can recognise it
- Size and ratio: 1024x1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `dock_map` (approved), and the first approved icon of this group once there is one
- Save as: `assets/approved/level/level_home_3.png`
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached an approved icon; match its style exactly. A single game icon object, centred, filling about 80% of the frame, no tile or background shape: two soft toys sitting together on a small rug next to a box of building blocks. Chunky, rounded, easy to read at small size. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters. No people.

### level_home_4   status: approved (2026-10-11)
- Used in: Home place map, above level 4's stone ("Bedtime worries")
- Purpose: Shows what level 4 is about, so a child who can't read can recognise it
- Size and ratio: 1024x1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `dock_map` (approved), and the first approved icon of this group once there is one
- Save as: `assets/approved/level/level_home_4.png`
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached an approved icon; match its style exactly. A single game icon object, centred, filling about 80% of the frame, no tile or background shape: a cosy small bed with a fluffy pillow, a soft night-light and a crescent moon in the window. Chunky, rounded, easy to read at small size. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters. No people.

### level_home_5   status: approved (2026-10-11)
- Used in: Home place map, above level 5's stone ("Going out to play")
- Purpose: Shows what level 5 is about, so a child who can't read can recognise it
- Size and ratio: 1024x1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `dock_map` (approved), and the first approved icon of this group once there is one
- Save as: `assets/approved/level/level_home_5.png`
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached an approved icon; match its style exactly. A single game icon object, centred, filling about 80% of the frame, no tile or background shape: a colourful ball rolling out of an open garden gate. Chunky, rounded, easy to read at small size. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters. No people.

### Group 4: mascot pose (the mascot chat)

### mascot_making   status: approved (2026-10-11)
- Used in: Level screen when a level has no activity yet ("This adventure is still being made")
- Purpose: An honest, cheerful "we're still making it" moment, never an error
- Size and ratio: 1024x1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `OFFICIAL MASCOT`, `mascot_idle` (approved), `FACE: happy`
- Save as: `assets/approved/mascot/mascot_making.png`
- Prompt (paste into ChatGPT):
  > Create an image. I attached the official mascot. Keep this exact character: same design, proportions, colours, glossy kawaii vector style, antenna with amber orb, dark blue screen face with sparkle eyes, pink cheeks, heart on the belly, stubby arms and feet. Change only the pose and expression: holding a small paintbrush up in one hand and a little toolbox in the other, as if busy building something, and a happy, focused face with a small smile on the screen face. Full body, centred, transparent background PNG (plain white if transparency fails), 1024×1024, no ground shadow, no text, no letters, no other characters.

### Group 5: Park, School, Club and Market place maps (one chat; P2)

### place_park_map_h   status: approved (2026-10-13, reviewed by Claude Code; made by a colleague with the OpenAI image tool via Codex)
- Used in: Place map of Park (landscape): `/place/park`
- Purpose: The Park's own map; its 5 level stones sit on the pads
- Size and ratio: 1536x1024 landscape
- Background: none (full scene, opaque)
- Upload with the prompt: `MAP H`
- Save as: `assets/approved/place/place_park_map_h.png`
- Prompt (paste into ChatGPT):
  > Create an image. Wide 3:2 landscape game map, opaque (no transparency needed). I attached our approved world map: match its art style, colours, camera angle (soft three-quarter top-down), lighting from the top-left and level of detail exactly. This is the inside map of one place, the Park: a sunny park seen from above: a swing set under a big tree, a calm pond with lily pads and a little wooden bridge, an open lawn with a small goal for ball games, a picnic blanket area and a quiet bench under a tree. A single wide, smooth light-beige path enters at the middle of the left edge and leaves at the middle of the right edge, winding gently up and down. Along the path are exactly 5 large, flat, EMPTY round stone pads (the same stone pads as on the attached map), evenly spaced, with nothing standing on them and open space around each pad. Leave a calm, mostly plain strip at the very top for a name sign. No people, no animals, no characters. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters.

### place_park_map_v   status: approved (2026-10-13, reviewed by Claude Code; made by a colleague with the OpenAI image tool via Codex)
- Used in: Place map of Park (portrait): `/place/park`
- Purpose: The Park's own map; its 5 level stones sit on the pads
- Size and ratio: 1024x1536 portrait
- Background: none (full scene, opaque)
- Upload with the prompt: `MAP V`
- Save as: `assets/approved/place/place_park_map_v.png`
- Prompt (paste into ChatGPT):
  > Create an image. Tall 2:3 portrait game map, opaque (no transparency needed). I attached our approved world map: match its art style, colours, camera angle (soft three-quarter top-down), lighting from the top-left and level of detail exactly. This is the inside map of one place, the Park: a sunny park seen from above: a swing set under a big tree, a calm pond with lily pads and a little wooden bridge, an open lawn with a small goal for ball games, a picnic blanket area and a quiet bench under a tree. A single wide, smooth light-beige path enters at the middle of the bottom edge and leaves at the middle of the top edge, winding gently left and right. Along the path are exactly 5 large, flat, EMPTY round stone pads (the same stone pads as on the attached map), evenly spaced, with nothing standing on them and open space around each pad. Leave a calm, mostly plain strip at the very top for a name sign. No people, no animals, no characters. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters.

### place_school_map_h   status: approved (2026-10-13, reviewed by Claude Code; made by a colleague with the OpenAI image tool via Codex)
- Used in: Place map of School (landscape): `/place/school`
- Purpose: The School's own map; its 5 level stones sit on the pads
- Size and ratio: 1536x1024 landscape
- Background: none (full scene, opaque)
- Upload with the prompt: `MAP H`
- Save as: `assets/approved/place/place_school_map_h.png`
- Prompt (paste into ChatGPT):
  > Create an image. Wide 3:2 landscape game map, opaque (no transparency needed). I attached our approved world map: match its art style, colours, camera angle (soft three-quarter top-down), lighting from the top-left and level of detail exactly. This is the inside map of one place, the School: a friendly school yard seen from above: the school entrance with a clock, a classroom window with desks inside, a playground with a slide, a reading corner bench with books, and a few small trees. A single wide, smooth light-beige path enters at the middle of the left edge and leaves at the middle of the right edge, winding gently up and down. Along the path are exactly 5 large, flat, EMPTY round stone pads (the same stone pads as on the attached map), evenly spaced, with nothing standing on them and open space around each pad. Leave a calm, mostly plain strip at the very top for a name sign. No people, no animals, no characters. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters.

### place_school_map_v   status: approved (2026-10-13, reviewed by Claude Code; made by a colleague with the OpenAI image tool via Codex)
- Used in: Place map of School (portrait): `/place/school`
- Purpose: The School's own map; its 5 level stones sit on the pads
- Size and ratio: 1024x1536 portrait
- Background: none (full scene, opaque)
- Upload with the prompt: `MAP V`
- Save as: `assets/approved/place/place_school_map_v.png`
- Prompt (paste into ChatGPT):
  > Create an image. Tall 2:3 portrait game map, opaque (no transparency needed). I attached our approved world map: match its art style, colours, camera angle (soft three-quarter top-down), lighting from the top-left and level of detail exactly. This is the inside map of one place, the School: a friendly school yard seen from above: the school entrance with a clock, a classroom window with desks inside, a playground with a slide, a reading corner bench with books, and a few small trees. A single wide, smooth light-beige path enters at the middle of the bottom edge and leaves at the middle of the top edge, winding gently left and right. Along the path are exactly 5 large, flat, EMPTY round stone pads (the same stone pads as on the attached map), evenly spaced, with nothing standing on them and open space around each pad. Leave a calm, mostly plain strip at the very top for a name sign. No people, no animals, no characters. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters.

### place_club_map_h   status: approved (2026-10-13, reviewed by Claude Code; made by a colleague with the OpenAI image tool via Codex)
- Used in: Place map of Club (landscape): `/place/club`
- Purpose: The Club's own map; its 5 level stones sit on the pads
- Size and ratio: 1536x1024 landscape
- Background: none (full scene, opaque)
- Upload with the prompt: `MAP H`
- Save as: `assets/approved/place/place_club_map_h.png`
- Prompt (paste into ChatGPT):
  > Create an image. Wide 3:2 landscape game map, opaque (no transparency needed). I attached our approved world map: match its art style, colours, camera angle (soft three-quarter top-down), lighting from the top-left and level of detail exactly. This is the inside map of one place, the Club: a colourful activity club seen from above: a music corner with drums, an art corner with an easel, a small sports yard, a group circle of cushions, and a little stage with curtains. A single wide, smooth light-beige path enters at the middle of the left edge and leaves at the middle of the right edge, winding gently up and down. Along the path are exactly 5 large, flat, EMPTY round stone pads (the same stone pads as on the attached map), evenly spaced, with nothing standing on them and open space around each pad. Leave a calm, mostly plain strip at the very top for a name sign. No people, no animals, no characters. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters.

### place_club_map_v   status: approved (2026-10-13, reviewed by Claude Code; made by a colleague with the OpenAI image tool via Codex)
- Used in: Place map of Club (portrait): `/place/club`
- Purpose: The Club's own map; its 5 level stones sit on the pads
- Size and ratio: 1024x1536 portrait
- Background: none (full scene, opaque)
- Upload with the prompt: `MAP V`
- Save as: `assets/approved/place/place_club_map_v.png`
- Prompt (paste into ChatGPT):
  > Create an image. Tall 2:3 portrait game map, opaque (no transparency needed). I attached our approved world map: match its art style, colours, camera angle (soft three-quarter top-down), lighting from the top-left and level of detail exactly. This is the inside map of one place, the Club: a colourful activity club seen from above: a music corner with drums, an art corner with an easel, a small sports yard, a group circle of cushions, and a little stage with curtains. A single wide, smooth light-beige path enters at the middle of the bottom edge and leaves at the middle of the top edge, winding gently left and right. Along the path are exactly 5 large, flat, EMPTY round stone pads (the same stone pads as on the attached map), evenly spaced, with nothing standing on them and open space around each pad. Leave a calm, mostly plain strip at the very top for a name sign. No people, no animals, no characters. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters.

### place_market_map_h   status: approved (2026-10-13, reviewed by Claude Code; made by a colleague with the OpenAI image tool via Codex)
- Used in: Place map of Market (landscape): `/place/market`
- Purpose: The Market's own map; its 5 level stones sit on the pads
- Size and ratio: 1536x1024 landscape
- Background: none (full scene, opaque)
- Upload with the prompt: `MAP H`
- Save as: `assets/approved/place/place_market_map_h.png`
- Prompt (paste into ChatGPT):
  > Create an image. Wide 3:2 landscape game map, opaque (no transparency needed). I attached our approved world map: match its art style, colours, camera angle (soft three-quarter top-down), lighting from the top-left and level of detail exactly. This is the inside map of one place, the Market: a friendly outdoor market seen from above: fruit and vegetable stalls with striped awnings, a toy stall, a small flower stall, a fountain in a little square, and a short queue area with soft rope posts. A single wide, smooth light-beige path enters at the middle of the left edge and leaves at the middle of the right edge, winding gently up and down. Along the path are exactly 5 large, flat, EMPTY round stone pads (the same stone pads as on the attached map), evenly spaced, with nothing standing on them and open space around each pad. Leave a calm, mostly plain strip at the very top for a name sign. No people, no animals, no characters. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters.

### place_market_map_v   status: approved (2026-10-13, reviewed by Claude Code; made by a colleague with the OpenAI image tool via Codex)
- Used in: Place map of Market (portrait): `/place/market`
- Purpose: The Market's own map; its 5 level stones sit on the pads
- Size and ratio: 1024x1536 portrait
- Background: none (full scene, opaque)
- Upload with the prompt: `MAP V`
- Save as: `assets/approved/place/place_market_map_v.png`
- Prompt (paste into ChatGPT):
  > Create an image. Tall 2:3 portrait game map, opaque (no transparency needed). I attached our approved world map: match its art style, colours, camera angle (soft three-quarter top-down), lighting from the top-left and level of detail exactly. This is the inside map of one place, the Market: a friendly outdoor market seen from above: fruit and vegetable stalls with striped awnings, a toy stall, a small flower stall, a fountain in a little square, and a short queue area with soft rope posts. A single wide, smooth light-beige path enters at the middle of the bottom edge and leaves at the middle of the top edge, winding gently left and right. Along the path are exactly 5 large, flat, EMPTY round stone pads (the same stone pads as on the attached map), evenly spaced, with nothing standing on them and open space around each pad. Leave a calm, mostly plain strip at the very top for a name sign. No people, no animals, no characters. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters.

### Group 6: Park, School, Club and Market arrival pictures and level icons (one chat per place; P2)

### loading_place_park   status: approved (2026-10-13, reviewed by Claude Code; made by a colleague with the OpenAI image tool via Codex)
- Used in: Loading scene while the Park map opens (above the hopping mascot)
- Purpose: Shows the child where they are going while the Park loads
- Size and ratio: 1024x1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `MAP H` (style), `dock_map` (approved, icon finish)
- Save as: `assets/approved/place/loading_place_park.png`
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached our approved map and an approved icon; match their style. A single friendly object picture, centred, filling about 80% of the frame, no scene and no background shape: a friendly park entrance: a rounded arch of leaves and flowers over a path, with a small bush on each side. Welcoming and calm. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters. No people.

### level_park_1   status: approved (2026-10-13, reviewed by Claude Code; made by a colleague with the OpenAI image tool via Codex)
- Used in: Park place map, above level 1's stone ("Waiting for a turn")
- Purpose: Shows what level 1 is about, so a child who can't read can recognise it
- Size and ratio: 1024x1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `dock_map` (approved), and the first approved icon of this group once there is one
- Save as: `assets/approved/level/level_park_1.png`
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached an approved icon; match its style exactly. A single game icon object, centred, filling about 80% of the frame, no tile or background shape: a wooden swing hanging from a tree branch. Chunky, rounded, easy to read at small size. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters. No people.

### level_park_2   status: approved (2026-10-13, reviewed by Claude Code; made by a colleague with the OpenAI image tool via Codex)
- Used in: Park place map, above level 2's stone ("Calming down by the pond")
- Purpose: Shows what level 2 is about, so a child who can't read can recognise it
- Size and ratio: 1024x1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `dock_map` (approved), and the first approved icon of this group once there is one
- Save as: `assets/approved/level/level_park_2.png`
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached an approved icon; match its style exactly. A single game icon object, centred, filling about 80% of the frame, no tile or background shape: a small round pond with lily pads and one pink water flower. Chunky, rounded, easy to read at small size. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters. No people.

### level_park_3   status: approved (2026-10-13, reviewed by Claude Code; made by a colleague with the OpenAI image tool via Codex)
- Used in: Park place map, above level 3's stone ("Losing a game")
- Purpose: Shows what level 3 is about, so a child who can't read can recognise it
- Size and ratio: 1024x1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `dock_map` (approved), and the first approved icon of this group once there is one
- Save as: `assets/approved/level/level_park_3.png`
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached an approved icon; match its style exactly. A single game icon object, centred, filling about 80% of the frame, no tile or background shape: a soft ball in front of a small goal net. Chunky, rounded, easy to read at small size. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters. No people.

### level_park_4   status: approved (2026-10-13, reviewed by Claude Code; made by a colleague with the OpenAI image tool via Codex)
- Used in: Park place map, above level 4's stone ("Sharing a picnic")
- Purpose: Shows what level 4 is about, so a child who can't read can recognise it
- Size and ratio: 1024x1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `dock_map` (approved), and the first approved icon of this group once there is one
- Save as: `assets/approved/level/level_park_4.png`
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached an approved icon; match its style exactly. A single game icon object, centred, filling about 80% of the frame, no tile or background shape: a picnic basket on a checked blanket with two apples. Chunky, rounded, easy to read at small size. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters. No people.

### level_park_5   status: approved (2026-10-13, reviewed by Claude Code; made by a colleague with the OpenAI image tool via Codex)
- Used in: Park place map, above level 5's stone ("Helping someone who is sad")
- Purpose: Shows what level 5 is about, so a child who can't read can recognise it
- Size and ratio: 1024x1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `dock_map` (approved), and the first approved icon of this group once there is one
- Save as: `assets/approved/level/level_park_5.png`
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached an approved icon; match its style exactly. A single game icon object, centred, filling about 80% of the frame, no tile or background shape: a small park bench with a soft pink heart floating above it. Chunky, rounded, easy to read at small size. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters. No people.

### loading_place_school   status: approved (2026-10-13, reviewed by Claude Code; made by a colleague with the OpenAI image tool via Codex)
- Used in: Loading scene while the School map opens (above the hopping mascot)
- Purpose: Shows the child where they are going while the School loads
- Size and ratio: 1024x1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `MAP H` (style), `dock_map` (approved, icon finish)
- Save as: `assets/approved/place/loading_place_school.png`
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached our approved map and an approved icon; match their style. A single friendly object picture, centred, filling about 80% of the frame, no scene and no background shape: the friendly double doors of a school entrance with a round clock above them and two small bushes. Welcoming and calm. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters. No people.

### level_school_1   status: approved (2026-10-13, reviewed by Claude Code; made by a colleague with the OpenAI image tool via Codex)
- Used in: School place map, above level 1's stone ("The first day")
- Purpose: Shows what level 1 is about, so a child who can't read can recognise it
- Size and ratio: 1024x1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `dock_map` (approved), and the first approved icon of this group once there is one
- Save as: `assets/approved/level/level_school_1.png`
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached an approved icon; match its style exactly. A single game icon object, centred, filling about 80% of the frame, no tile or background shape: a new school bag with a ribbon tied on it. Chunky, rounded, easy to read at small size. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters. No people.

### level_school_2   status: approved (2026-10-13, reviewed by Claude Code; made by a colleague with the OpenAI image tool via Codex)
- Used in: School place map, above level 2's stone ("Nervous about a test")
- Purpose: Shows what level 2 is about, so a child who can't read can recognise it
- Size and ratio: 1024x1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `dock_map` (approved), and the first approved icon of this group once there is one
- Save as: `assets/approved/level/level_school_2.png`
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached an approved icon; match its style exactly. A single game icon object, centred, filling about 80% of the frame, no tile or background shape: a pencil lying on a blank sheet of paper on a small desk (the paper is completely blank). Chunky, rounded, easy to read at small size. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters. No people.

### level_school_3   status: approved (2026-10-13, reviewed by Claude Code; made by a colleague with the OpenAI image tool via Codex)
- Used in: School place map, above level 3's stone ("Feeling left out")
- Purpose: Shows what level 3 is about, so a child who can't read can recognise it
- Size and ratio: 1024x1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `dock_map` (approved), and the first approved icon of this group once there is one
- Save as: `assets/approved/level/level_school_3.png`
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached an approved icon; match its style exactly. A single game icon object, centred, filling about 80% of the frame, no tile or background shape: one small chair standing a little apart from a cosy circle of chairs. Chunky, rounded, easy to read at small size. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters. No people.

### level_school_4   status: approved (2026-10-13, reviewed by Claude Code; made by a colleague with the OpenAI image tool via Codex)
- Used in: School place map, above level 4's stone ("Making a friend")
- Purpose: Shows what level 4 is about, so a child who can't read can recognise it
- Size and ratio: 1024x1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `dock_map` (approved), and the first approved icon of this group once there is one
- Save as: `assets/approved/level/level_school_4.png`
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached an approved icon; match its style exactly. A single game icon object, centred, filling about 80% of the frame, no tile or background shape: two kites flying side by side with their strings crossing. Chunky, rounded, easy to read at small size. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters. No people.

### level_school_5   status: approved (2026-10-13, reviewed by Claude Code; made by a colleague with the OpenAI image tool via Codex)
- Used in: School place map, above level 5's stone ("Arguing with a friend")
- Purpose: Shows what level 5 is about, so a child who can't read can recognise it
- Size and ratio: 1024x1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `dock_map` (approved), and the first approved icon of this group once there is one
- Save as: `assets/approved/level/level_school_5.png`
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached an approved icon; match its style exactly. A single game icon object, centred, filling about 80% of the frame, no tile or background shape: two block towers next to each other, one leaning, with a small calm cloud above. Chunky, rounded, easy to read at small size. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters. No people.

### loading_place_club   status: approved (2026-10-13, reviewed by Claude Code; made by a colleague with the OpenAI image tool via Codex)
- Used in: Loading scene while the Club map opens (above the hopping mascot)
- Purpose: Shows the child where they are going while the Club loads
- Size and ratio: 1024x1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `MAP H` (style), `dock_map` (approved, icon finish)
- Save as: `assets/approved/place/loading_place_club.png`
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached our approved map and an approved icon; match their style. A single friendly object picture, centred, filling about 80% of the frame, no scene and no background shape: a small stage with soft curtains just opening and bunting above it. Welcoming and calm. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters. No people.

### level_club_1   status: approved (2026-10-13, reviewed by Claude Code; made by a colleague with the OpenAI image tool via Codex)
- Used in: Club place map, above level 1's stone ("Joining a group")
- Purpose: Shows what level 1 is about, so a child who can't read can recognise it
- Size and ratio: 1024x1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `dock_map` (approved), and the first approved icon of this group once there is one
- Save as: `assets/approved/level/level_club_1.png`
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached an approved icon; match its style exactly. A single game icon object, centred, filling about 80% of the frame, no tile or background shape: a circle of soft floor cushions with one cushion slightly apart, inviting. Chunky, rounded, easy to read at small size. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters. No people.

### level_club_2   status: approved (2026-10-13, reviewed by Claude Code; made by a colleague with the OpenAI image tool via Codex)
- Used in: Club place map, above level 2's stone ("Taking turns in music")
- Purpose: Shows what level 2 is about, so a child who can't read can recognise it
- Size and ratio: 1024x1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `dock_map` (approved), and the first approved icon of this group once there is one
- Save as: `assets/approved/level/level_club_2.png`
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached an approved icon; match its style exactly. A single game icon object, centred, filling about 80% of the frame, no tile or background shape: a small drum and a xylophone side by side. Chunky, rounded, easy to read at small size. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters. No people.

### level_club_3   status: approved (2026-10-13, reviewed by Claude Code; made by a colleague with the OpenAI image tool via Codex)
- Used in: Club place map, above level 3's stone ("Hearing feedback on art")
- Purpose: Shows what level 3 is about, so a child who can't read can recognise it
- Size and ratio: 1024x1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `dock_map` (approved), and the first approved icon of this group once there is one
- Save as: `assets/approved/level/level_club_3.png`
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached an approved icon; match its style exactly. A single game icon object, centred, filling about 80% of the frame, no tile or background shape: an easel with a canvas showing a simple sun and a paint palette (no letters). Chunky, rounded, easy to read at small size. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters. No people.

### level_club_4   status: approved (2026-10-13, reviewed by Claude Code; made by a colleague with the OpenAI image tool via Codex)
- Used in: Club place map, above level 4's stone ("Losing as a team")
- Purpose: Shows what level 4 is about, so a child who can't read can recognise it
- Size and ratio: 1024x1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `dock_map` (approved), and the first approved icon of this group once there is one
- Save as: `assets/approved/level/level_club_4.png`
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached an approved icon; match its style exactly. A single game icon object, centred, filling about 80% of the frame, no tile or background shape: a soft ball and two small team flags without any symbols. Chunky, rounded, easy to read at small size. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters. No people.

### level_club_5   status: approved (2026-10-13, reviewed by Claude Code; made by a colleague with the OpenAI image tool via Codex)
- Used in: Club place map, above level 5's stone ("Stage fright")
- Purpose: Shows what level 5 is about, so a child who can't read can recognise it
- Size and ratio: 1024x1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `dock_map` (approved), and the first approved icon of this group once there is one
- Save as: `assets/approved/level/level_club_5.png`
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached an approved icon; match its style exactly. A single game icon object, centred, filling about 80% of the frame, no tile or background shape: a microphone on a stand in front of small stage curtains. Chunky, rounded, easy to read at small size. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters. No people.

### loading_place_market   status: approved (2026-10-13, reviewed by Claude Code; made by a colleague with the OpenAI image tool via Codex)
- Used in: Loading scene while the Market map opens (above the hopping mascot)
- Purpose: Shows the child where they are going while the Market loads
- Size and ratio: 1024x1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `MAP H` (style), `dock_map` (approved, icon finish)
- Save as: `assets/approved/place/loading_place_market.png`
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached our approved map and an approved icon; match their style. A single friendly object picture, centred, filling about 80% of the frame, no scene and no background shape: the striped awning of a friendly market stall with fruit baskets underneath. Welcoming and calm. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters. No people.

### level_market_1   status: approved (2026-10-13, reviewed by Claude Code; made by a colleague with the OpenAI image tool via Codex)
- Used in: Market place map, above level 1's stone ("Waiting in line")
- Purpose: Shows what level 1 is about, so a child who can't read can recognise it
- Size and ratio: 1024x1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `dock_map` (approved), and the first approved icon of this group once there is one
- Save as: `assets/approved/level/level_market_1.png`
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached an approved icon; match its style exactly. A single game icon object, centred, filling about 80% of the frame, no tile or background shape: two soft rope posts with a rope between them, like a small queue line. Chunky, rounded, easy to read at small size. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters. No people.

### level_market_2   status: approved (2026-10-13, reviewed by Claude Code; made by a colleague with the OpenAI image tool via Codex)
- Used in: Market place map, above level 2's stone ("Wanting something you can't have")
- Purpose: Shows what level 2 is about, so a child who can't read can recognise it
- Size and ratio: 1024x1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `dock_map` (approved), and the first approved icon of this group once there is one
- Save as: `assets/approved/level/level_market_2.png`
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached an approved icon; match its style exactly. A single game icon object, centred, filling about 80% of the frame, no tile or background shape: a shiny toy car behind a shop window. Chunky, rounded, easy to read at small size. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters. No people.

### level_market_3   status: approved (2026-10-13, reviewed by Claude Code; made by a colleague with the OpenAI image tool via Codex)
- Used in: Market place map, above level 3's stone ("Feeling lost")
- Purpose: Shows what level 3 is about, so a child who can't read can recognise it
- Size and ratio: 1024x1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `dock_map` (approved), and the first approved icon of this group once there is one
- Save as: `assets/approved/level/level_market_3.png`
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached an approved icon; match its style exactly. A single game icon object, centred, filling about 80% of the frame, no tile or background shape: a round friendly compass with a heart instead of a needle tip. Chunky, rounded, easy to read at small size. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters. No people.

### level_market_4   status: approved (2026-10-13, reviewed by Claude Code; made by a colleague with the OpenAI image tool via Codex)
- Used in: Market place map, above level 4's stone ("Being honest")
- Purpose: Shows what level 4 is about, so a child who can't read can recognise it
- Size and ratio: 1024x1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `dock_map` (approved), and the first approved icon of this group once there is one
- Save as: `assets/approved/level/level_market_4.png`
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached an approved icon; match its style exactly. A single game icon object, centred, filling about 80% of the frame, no tile or background shape: a small coin purse next to a red apple. Chunky, rounded, easy to read at small size. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters. No people.

### level_market_5   status: approved (2026-10-13, reviewed by Claude Code; made by a colleague with the OpenAI image tool via Codex)
- Used in: Market place map, above level 5's stone ("Being kind")
- Purpose: Shows what level 5 is about, so a child who can't read can recognise it
- Size and ratio: 1024x1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `dock_map` (approved), and the first approved icon of this group once there is one
- Save as: `assets/approved/level/level_market_5.png`
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached an approved icon; match its style exactly. A single game icon object, centred, filling about 80% of the frame, no tile or background shape: a small bouquet of flowers tied with a ribbon. Chunky, rounded, easy to read at small size. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no extra characters. No people.

## Batch 4 (stories: workshop, bookshelf, storybook), written 2026-10-11 (D-070, docs/STORIES.md)
Everything here is optional: the story screens already work with approved art and words; each file
replaces a stand-in the moment it is approved (no code change). Priority: Group 1, then 2, then 3.

### Group 1: the book and the shelf (one chat; upload `dock_stories` (approved) for the style)
| Save as | Shape | What to draw (paste into the prompt below as THING) |
|---|---|---|
| `assets/approved/ui/story_book_open.png` | 1536x1024 landscape | an open hardcover storybook seen straight from the front, two blank cream pages, a soft purple (#614194) cover edge around them, a gentle fold at the spine |
| `assets/approved/ui/story_page_paper.png` | 1024x1536 portrait | a single blank cream storybook page with soft deckled edges, slightly curled bottom corner |
| `assets/approved/ui/story_book_cover.png` | 1024x1536 portrait | a closed hardcover book, front view, soft purple cover with a small gold heart emblem at the top and an EMPTY area in the middle |
| `assets/approved/ui/story_shelf.png` | 1536x1024 landscape | a cosy rounded wooden bookshelf with two EMPTY shelves, warm honey wood, a small potted plant on top |
| `assets/approved/ui/ui_story_slot.png` | 1024x1024 square | an empty round medallion frame with a soft gold rim and a cream inside, like a badge waiting for a picture |
| `assets/approved/ui/ui_story_wand.png` | 1024x1024 square | a friendly magic wand with a soft amber star on top and three tiny sparkles |
| `assets/approved/mascot/mascot_reading.png` | 1024x1024 square | (mascot chat, upload the OFFICIAL MASCOT) the mascot holding an open storybook with both arm-flaps, looking up happily |

Prompt (Group 1, except the mascot):
> Create an image. Transparent background PNG (plain white if transparency fails), in the size and shape given. I attached an approved game icon; match its style, outline and glossy finish. A single object: THING. Centred, filling about 85% of the frame, no ground shadow. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no people.

Prompt (mascot_reading): use the standard mascot prompt in docs/MASCOT.md with POSE "holding an open storybook in front of its belly with both arm-flaps" and FACE "happy, sparkly eyes looking up, small open smile".

### Group 2: the story corner scene (one chat; upload `scene_meadow_land` (approved))
| Save as | Shape |
|---|---|
| `assets/approved/world/scene_story_corner_land.png` | 1536x1024 landscape |
| `assets/approved/world/scene_story_corner_port.png` | 1024x1536 portrait |

> Create an image. Opaque, in the size and shape given. I attached our approved meadow scene: match its art style, colours, light and level of detail exactly. A cosy reading corner in the same meadow: a big soft tree with a round reading nook at its foot, two plump cushions, a little lantern and a few books with blank covers, open grassy space in front for characters. Calm and warm. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no people.

### Group 3: story choices (one chat per row group; upload `like_animals` (approved) each time, so they match the "What do you like?" pictures)
Prompt (paste THING from the table):
> Create an image. Square 1:1, transparent background. I attached an approved game icon; match its style, outline and glossy finish exactly. A single chunky icon picture: THING. Bold, simple, big shapes, easy to recognise at 96 px. Centred, filling about 80% of the frame, no tile behind it, no ground shadow. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no people.

| Save as (`assets/approved/ui/`) | THING |
|---|---|
| `story_hero_fox.png` | a small orange fox with a fluffy white-tipped tail, standing proudly |
| `story_hero_bear.png` | a round, cuddly brown bear cub waving |
| `story_hero_bunny.png` | a little white bunny with long floppy ears, mid-hop |
| `story_hero_owl.png` | a small fluffy grey owl with big round amber eyes |
| `story_hero_turtle.png` | a little green turtle with a shiny patterned shell |
| `story_hero_dragon.png` | a tiny friendly purple dragon with small round wings, no sharp teeth |
| `story_hero_cat.png` | a small striped grey kitten with a curly tail |
| `story_hero_penguin.png` | a small round penguin with a sky-blue scarf |
| `story_place_forest.png` | three soft round trees with a glowing flower and a mushroom |
| `story_place_beach.png` | a striped beach umbrella on sand with a gentle wave and a shell |
| `story_place_space.png` | a ringed planet, a little rocket and two stars |
| `story_place_castle.png` | a small pastel castle floating on a soft cloud |
| `story_place_garden.png` | a flower bed with a tiny pond and a butterfly |
| `story_place_underwater.png` | coral, bubbles and a small friendly fish |
| `story_adv_lost_toy.png` | a soft teddy bear peeking out from behind a big green leaf |
| `story_adv_new_friend.png` | two different little animals waving hello to each other |
| `story_adv_big_race.png` | a small finish ribbon stretched between two little flags |
| `story_adv_birthday.png` | a small cake with one candle, two balloons and a wrapped present |
| `story_adv_storm.png` | a cosy little house window with rain and a soft lightning cloud outside, warm light inside |
| `story_adv_first_day.png` | a small backpack next to an open door with sunshine coming in |

### Group 4: four more feeling faces (one chat; upload the brand face `face_happy` and `face_sad`)
> Create an image. Square 1:1, transparent background. I attached two official brand feeling faces; keep exactly their design (the dark blue rounded screen-face shape, outline, sparkle eyes, pink cheeks, glossy finish). Change only the expression to FEELING. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no people.

| Save as (`brand/feelings-expressions/png/`) | FEELING |
|---|---|
| `face_worried.png` | worried: eyebrows raised in the middle, small wobbly mouth |
| `face_proud.png` | proud: eyes happily closed, big confident smile |
| `face_lonely.png` | lonely: eyes looking down to the side, small sad mouth |
| `face_jealous.png` | jealous: eyes looking sideways, small pout |

## Batch 5 (redesign v2: each page its own place), written 2026-10-12 (D-071, docs/REDESIGN_V2.md)
Everything here is optional: every page already works with flat brand colours in its place, and each
file replaces that stand-in the moment it is approved (no code change). A scene is only used once BOTH
its landscape and portrait files are approved. Priority: Group 1 (scenes), then 2 (album), then 3 (poses).

### Group 1: four scenes (one chat per scene; upload `scene_meadow_land` (approved) each time for the style)
Prompt (paste PLACE from the table; make the landscape file first, then ask for the same scene in portrait):
> Create an image. Opaque, in the size and shape given. I attached our approved meadow scene: match its art style, colours, light and level of detail exactly. PLACE. Keep the middle of the picture calm and open: our app puts characters, words and buttons there, so no important detail in the centre and nothing busy behind it. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no people.

| Save as (`assets/approved/world/`, 1536x1024 landscape and 1024x1536 portrait) | Used on | PLACE |
|---|---|---|
| `scene_talk_nook_land.png`, `scene_talk_nook_port.png` | Talk | a cosy little nook at dusk: a round window with a deep lilac evening sky and first stars, a big soft floor cushion, a warm glowing lamp to one side, a few hanging paper stars. Quiet and safe |
| `scene_story_stage_land.png`, `scene_story_stage_port.png` | Story workshop | the inside of a small, friendly puppet theatre hall seen from the audience: deep plum walls, warm amber wall lamps, rose velvet drapes gathered at the far left and right edges, the tops of a few round seats along the very bottom. NO stage in the middle: the middle is a plain, softly lit plum wall |
| `scene_library_land.png`, `scene_library_port.png` | Bookshelf, storybook | a warm, cosy children's library room: cream walls with soft stripes, a round window with daylight, a reading rug, a little ladder and plants at the sides, warm honey wood floor. NO bookshelves in the middle: the middle is a plain cream wall (our shelves go there) |
| `scene_treasure_room_land.png`, `scene_treasure_room_port.png` | My collection | a magical treasure room for a child's keepsakes: plum walls with soft gold arches, a few small open treasure chests with gentle light and stars at the far sides, a soft rose rug on a warm floor. The middle is calm and open |

### Group 2: the sticker album (one chat; upload `dock_collection` (approved) for the style)
| Save as | Shape | THING |
|---|---|---|
| `assets/approved/ui/ui_sticker_album_open.png` | 1536x1024 landscape | an open sticker album seen straight from the front, filling the whole frame edge to edge: a soft purple (#614194) padded cover around two EMPTY cream pages, a gentle fold at the spine, three tiny decorative stars only in the corners of the cover. The pages are completely blank |

Prompt: the Batch 4 Group 1 prompt (single object), with THING from the table, filling about 95% of the frame.

### Group 3: two mascot poses (mascot chat; upload the OFFICIAL MASCOT and `mascot_idle` as references)
Use the standard mascot prompt in docs/MASCOT.md with:
| Save as (`assets/approved/mascot/`) | POSE | FACE |
|---|---|---|
| `mascot_directing.png` | standing side-on, one arm-flap raised and pointing forward like a friendly play director, the other on its hip | excited, sparkly eyes, big open smile |
| `mascot_holding_album.png` | hugging a small closed purple album to its chest with both arm-flaps | proud and happy, eyes curved, warm smile |

## Batch 6 (My room), written 2026-10-13 (D-074, docs/superpowers/specs/2026-10-13-my-room-design.md)
Made with Codex from the job list `assets/requests/batch6/jobs.json` (full prompt, references, size and transparency for each file; brief: `assets/requests/batch6/CODEX.md`). Files land in `assets/incoming/batch6/` (git-ignored) and are reviewed by Claude Code before they move to `assets/approved/`. Until then the room objects and wardrobe tiles show grey `TODO(PLACEHOLDER)` boxes and the room uses the treasure-room scene.

| id | Shape | References | What to draw |
|---|---|---|---|
| `scene_my_room_land` | 1536x1024 opaque | `scene_meadow_land` | the bedroom, landscape |
| `scene_my_room_port` | 1024x1536 opaque | `scene_meadow_land`, `scene_my_room_land` | the bedroom, portrait (make after the landscape one) |
| `room_wardrobe` | 1024x1024 transparent | `dock_collection` | a small rounded wooden wardrobe with its two doors slightly open and a soft lilac glow inside |
| `room_gift_box` | 1024x1024 transparent | `dock_collection` | a big gift box in purple with a rose ribbon and a large bow, lid closed |
| `room_star_shelf` | 1024x1024 transparent | `dock_collection` | an empty floating wooden wall shelf with two small rounded brackets |
| `room_feelings_jar` | 1024x1024 transparent | `dock_collection` | an empty round glass jar with a cork lid and a soft warm glow inside |
| `room_pinboard` | 1024x1024 transparent | `dock_collection` | an empty cork pinboard with a rounded wooden frame and four coloured pins in the corners |
| `room_book_stack` | 1024x1024 transparent | `dock_collection` | a small stack of three books with blank, plain covers on a tiny round wooden table |
| `wear_party_hat` | 1024x1024 transparent | `avatar_bun_amber_idle`, `dock_collection` | a small striped party hat in rose and amber with a fluffy pompom on top |
| `wear_flower_crown` | 1024x1024 transparent | `avatar_bun_amber_idle`, `dock_collection` | a ring of small pastel flowers and green leaves worn on top of the head, front view |
| `wear_wizard_hat` | 1024x1024 transparent | `avatar_bun_amber_idle`, `dock_collection` | a small purple wizard hat with a soft brim, dotted with tiny amber stars |
| `wear_beanie` | 1024x1024 transparent | `avatar_bun_amber_idle`, `dock_collection` | a cosy knitted beanie in sky blue with a white pompom |
| `wear_round_glasses` | 1024x1024 transparent | `avatar_bun_amber_idle`, `dock_collection` | a pair of round glasses with purple frames and clear lenses, front view |
| `wear_star_glasses` | 1024x1024 transparent | `avatar_bun_amber_idle`, `dock_collection` | a pair of fun star-shaped glasses with amber frames, front view |
| `wear_heart_glasses` | 1024x1024 transparent | `avatar_bun_amber_idle`, `dock_collection` | a pair of heart-shaped glasses with rose frames and light pink lenses, front view |
| `wear_sunglasses` | 1024x1024 transparent | `avatar_bun_amber_idle`, `dock_collection` | a pair of rounded sunglasses with sky-blue frames and dark lilac lenses, front view |
| `wear_scarf` | 1024x1024 transparent | `avatar_bun_amber_idle`, `dock_collection` | a cosy knitted scarf in amber and rose stripes, wrapped like a collar with one end hanging down |
| `wear_bow_tie` | 1024x1024 transparent | `avatar_bun_amber_idle`, `dock_collection` | a small purple bow tie with white polka dots |
| `wear_flower_garland` | 1024x1024 transparent | `avatar_bun_amber_idle`, `dock_collection` | a soft garland of small pastel flowers hanging in a U shape like a necklace |
| `wear_star_medal` | 1024x1024 transparent | `avatar_bun_amber_idle`, `dock_collection` | a round gold medal with a raised star in the middle, hanging from a short rose ribbon loop |
| `wear_backpack` | 1024x1024 transparent | `avatar_bun_amber_idle`, `dock_collection` | a small rounded backpack in sky blue with an amber flap, seen from the front with both straps |
| `wear_cape` | 1024x1024 transparent | `avatar_bun_amber_idle`, `dock_collection` | a small hero cape in rose with a gold round clasp at the top, spread open as seen from the front |
| `wear_butterfly_wings` | 1024x1024 transparent | `avatar_bun_amber_idle`, `dock_collection` | a pair of soft butterfly wings in lilac and sky blue with gentle round patterns, spread open |
| `wear_balloon` | 1024x1024 transparent | `avatar_bun_amber_idle`, `dock_collection` | a single round amber balloon with a shine and a curly string |


## Batch 7 (story experience: action objects and step icons), written 2026-10-13 (D-075, docs/superpowers/specs/2026-10-13-story-experience-design.md)
Made with Codex from `assets/requests/batch7/jobs.json` (brief: `assets/requests/batch7/CODEX.md`) into the git-ignored `assets/incoming/batch7/`, checked by `npx tsx scripts/check-incoming.ts batch7`, then reviewed by Claude Code. The feeling step uses the approved brand face `face_happy`.

| id | Used for | What to draw |
|---|---|---|
| `ui_btn_make_story` | Library: make a new story | a magic wand with an amber star on top, hovering over an open storybook whose blank pages glow softly, with three tiny sparkles |
| `ui_btn_curtain_rope` | Theatre: pull to make the story | a thick golden theatre curtain rope hanging straight down, ending in a big fluffy golden tassel, with two tiny sparkles beside it |
| `ui_btn_read_aloud` | Storybook: read it to me | a friendly golden gramophone-style speaker horn with three soft rounded sound waves coming out of it |
| `ui_step_hero` | Step ticket: hero | a shining golden star wearing a tiny rose cape, standing proudly |
| `ui_step_place` | Step ticket: place | a tiny painted stage backdrop on a small wooden stand, showing rolling green hills and a round sun |
| `ui_step_adventure` | Step ticket: adventure | a rolled-open treasure map with a dotted path and a small round compass resting on it |


## Batch 8 (voice room: activity poses and start objects), written 2026-10-14 (D-076, docs/VOICE_ROOM.md)
Made with Codex from `assets/requests/batch8/jobs.json` (brief: `assets/requests/batch8/CODEX.md`) into the git-ignored `assets/incoming/batch8/`, checked by `npx tsx scripts/check-incoming.ts batch8`, then reviewed by Claude Code. Every mascot pose attaches the official mascot (`brand/mascot/default/png/IMG_9937.png`) and `mascot_idle`. **Optional:** until each one is approved, the room uses an approved stand-in (listed in `design/asset-slots.ts` and `child/activities.ts`), so nothing is blocked.

| id | Used for | What to draw |
|---|---|---|
| `mascot_breathe_in` | Breathing: breathing in | standing tall with the chest gently lifted, both stubby arms raised a little outward and upward as if slowly filling up with air; eyes softly closed in calm curved lines, a small closed peaceful smile |
| `mascot_breathe_out` | Breathing: breathing out | standing relaxed and soft, shoulders dropped, both arms resting low and loose at its sides; eyes softly closed in calm curved lines, mouth a small round 'o' as if gently blowing out (no visible air) |
| `mascot_look` | Noticing game: look around | one arm raised with its flat flap held just above the screen face like a sun visor, body leaning slightly to one side, curious; wide curious sparkle eyes looking to the side, small open smile |
| `mascot_hug` | Noticing game: feel; stretching: hug | both stubby arms wrapped around its own round body in a gentle, cosy self-hug; eyes closed in happy upward arcs, warm content smile |
| `mascot_stretch_up` | Stretching: reach up high | both arms stretched straight up high above its head on either side of the antenna, body standing tall on its toes; happy determined eyes, big open smile |
| `mascot_stretch_side` | Stretching: sway side to side | body leaning gently to one side like a bending tree, the arm on the other side arched over its head toward the lean, the near arm resting on its side; calm happy eyes, gentle smile |
| `mascot_shake` | Stretching: shake your hands | both arms held out to the sides, slightly bent, flaps loose as if shaking them out, knees a little bent, playful; eyes in happy upward arcs, laughing open smile |
| `ui_act_breathe` | Voice room: start breathing with the cloud | a plump soft pastel cloud resting on a small round lilac cushion, with three tiny sparkles above it |
| `ui_act_notice` | Voice room: start the noticing game | a chunky magnifying glass with a rounded amber handle and a sky-blue rim, a small soft amber star twinkling inside its lens |
| `ui_act_stretch` | Voice room: start stretching | a soft exercise mat in rose and lilac stripes, half rolled up, with a small amber star resting on the flat part |


## Batch 9 (The Tower: Nori), written 2026-10-20 (D-078, docs/SEL_ADVENTURES.md)
Made with Codex from `assets/requests/batch9/jobs.json` (brief: `CODEX.md`) into `assets/incoming/batch9/`. Nori is the first supporting-cast character (ART_DIRECTION §9): the sheet is approved first and is the identity reference for every pose. **Approved 2026-10-23** (all four, first try).

| id | Used for | status |
|---|---|---|
| `cast_nori_sheet` | The Tower: Nori identity reference sheet, not shown in app | approved |
| `cast_nori_idle` | The Tower: Nori standing calmly | approved |
| `cast_nori_oops` | The Tower: Nori accidentally bumps the tower | approved |
| `cast_nori_scared` | The Tower: Nori mildly worried after the reaction | approved |

## Batch 10 (The Tower: the rest), written 2026-10-23 (D-078)
Made with Codex from `assets/requests/batch10/jobs.json` (brief: `CODEX.md`) into `assets/incoming/batch10/`, checked by `npx tsx scripts/check-incoming.ts batch10`, then reviewed by Claude Code. The two Nori poses attach the approved sheet and idle pose. The tower and the fallen tower block the level (grey boxes until then); the rest have approved stand-ins.

| id | Used for | status |
|---|---|---|
| `cast_nori_sorry` | The Tower: Nori says sorry | requested |
| `cast_nori_happy` | The Tower: Nori builds with Feelio, and the end | requested |
| `prop_tower_tall` | The Tower: the block tower (it is revealed from the bottom up as the child taps) | requested |
| `prop_tower_fallen` | The Tower: the tower after Nori bumps it | requested |
| `prop_block_pile` | The Tower: the blocks the child taps to build | requested |
| `fx_storm_cloud` | The Tower: Feelio's angry storm, floating above its head | requested |
| `ui_choice_stomp` | The Tower: choice card "Stomp" | requested |
| `ui_choice_shout` | The Tower: choice card "Shout" | requested |
| `ui_choice_tell` | The Tower: choice card "Tell Nori" | requested |
| `ui_choice_together` | The Tower: choice card "Build together" | requested |


## Log
| id | requested | delivered | approved | notes |
|---|---|---|---|---|
| R-00 owner-exports | 2026-10-10 | 2026-10-10 | 2026-10-10 | 7 PNGs rasterised from the brand SVGs; optional mascot re-export open |
| map-h-ar | 2026-10-10 | 2026-10-10 | 2026-10-10 | P1 (Arabic map, landscape). Approved |
| map-v-ar | 2026-10-10 | 2026-10-10 | 2026-10-10 | P1 (Arabic map, portrait). Approved |
| mascot_idle | 2026-10-10 | 2026-10-10 | 2026-10-10 | P1. Approved; now the 2nd reference for every pose |
| mascot_marker | 2026-10-10 | 2026-10-10 | 2026-10-10 | P1. Approved |
| mascot_walking_left | 2026-10-10 | 2026-10-10 | 2026-10-10 | P1. Approved |
| mascot_walking_right | 2026-10-10 | 2026-10-10 | 2026-10-10 | P1. Approved |
| dock_map | 2026-10-10 | 2026-10-10 | 2026-10-10 | P1. Approved; style reference for the other dock icons |
| dock_talk | 2026-10-10 | 2026-10-10 | 2026-10-10 | P1. Approved |
| dock_stories | 2026-10-10 | 2026-10-10 | 2026-10-10 | P1. Approved |
| dock_collection | 2026-10-10 | 2026-10-10 | 2026-10-10 | P1. Approved |
| badge_lock | 2026-10-10 | 2026-10-10 | 2026-10-10 | P1. Approved |
| badge_star | 2026-10-10 | 2026-10-10 | 2026-10-10 | P1. Approved |
| badge_check | 2026-10-10 | 2026-10-10 | 2026-10-10 | P1. Approved |
| node_locked | 2026-10-10 | 2026-10-10 | 2026-10-10 | P1. Approved |
| node_current | 2026-10-10 | 2026-10-10 | 2026-10-10 | P1. Approved |
| node_completed | 2026-10-10 | 2026-10-10 | 2026-10-10 | P1. Approved |
| mascot_head_happy | 2026-10-10 | 2026-10-10 | 2026-10-10 | P1. Approved |
| mascot_happy | 2026-10-10 | 2026-10-10 | 2026-10-10 | P2. Approved |
| mascot_excited | 2026-10-10 | 2026-10-12 | 2026-10-13 | P2. Optional now: `mascot_feel_excited` covers the map tap reaction; generate the hop version only if you want more motion |
| mascot_waving | 2026-10-10 | 2026-10-10 | 2026-10-10 | P2. Approved |
| mascot_idle_blink | 2026-10-10 | 2026-10-10 | 2026-10-10 | P2. Approved |
| ring_current | 2026-10-10 | 2026-10-10 | 2026-10-10 | P2. Approved |
| mascot_sleeping | 2026-10-10 | 2026-10-10 | 2026-10-10 | P2 (from Batch B, needed for the offline shell). Approved |
| mascot_confused | 2026-10-10 | 2026-10-10 | 2026-10-10 | P2 (from Batch B, needed for error states). Approved |
| mascot_feel_excited | 2026-10-10 | 2026-10-10 | 2026-10-10 | P2b, face swap on mascot_idle. Approved |
| mascot_feel_sad | 2026-10-10 | 2026-10-10 | 2026-10-10 | P2b, face swap on mascot_idle. Approved |
| mascot_feel_angry | 2026-10-10 | 2026-10-10 | 2026-10-10 | P2b, face swap on mascot_idle; naming only. Approved |
| mascot_listening | 2026-10-10 | | | P3 (voice) |
| mascot_thinking | 2026-10-10 | 2026-10-12 | 2026-10-13 | P3 (voice) |
| mascot_speaking_half | 2026-10-10 | 2026-10-12 | 2026-10-13 | P3 (voice), base for the mouth frames |
| mascot_speaking_closed | 2026-10-10 | 2026-10-12 | 2026-10-13 | P3 (voice). Kept by owner decision 2026-10-13 (body not pixel-aligned; retry gave the same) |
| mascot_speaking_open | 2026-10-10 | 2026-10-12 | 2026-10-13 | P3 (voice). Kept by owner decision 2026-10-13 (body not pixel-aligned; retry gave the same) |
| dock_calm | 2026-10-10 | 2026-10-13 | 2026-10-13 | Dock, 5th button (D-055) (redo delivered) |
| place_home_map_h | 2026-10-11 | 2026-10-11 | approved | Batch 3, P1 (D-056); stones measured, backdrop #ca9e76 |
| place_home_map_v | 2026-10-11 | 2026-10-13 | 2026-10-13 | Batch 3, P1 (D-056) (redo delivered; stones measured) |
| node_in_progress | 2026-10-11 | | | Batch 3, P1 (D-056) |
| ui_celebrate_burst | 2026-10-11 | | | Batch 3, P1 (D-056) |
| loading_place_home | 2026-10-11 | | | Batch 3, P1 (D-056) |
| level_home_1 | 2026-10-11 | | | Batch 3, P1 (D-056) |
| level_home_2 | 2026-10-11 | | | Batch 3, P1 (D-056) |
| level_home_3 | 2026-10-11 | | | Batch 3, P1 (D-056) |
| level_home_4 | 2026-10-11 | | | Batch 3, P1 (D-056) |
| level_home_5 | 2026-10-11 | | | Batch 3, P1 (D-056) |
| mascot_making | 2026-10-11 | | | Batch 3, P1 (D-056) |
| place_park_map_h | 2026-10-11 | 2026-10-12 | 2026-10-13 | Batch 3, P2 (D-056) |
| place_park_map_v | 2026-10-11 | 2026-10-12 | 2026-10-13 | Batch 3, P2 (D-056) |
| loading_place_park | 2026-10-11 | 2026-10-12 | 2026-10-13 | Batch 3, P2 (D-056) |
| level_park_1 | 2026-10-11 | 2026-10-12 | 2026-10-13 | Batch 3, P2 (D-056) |
| level_park_2 | 2026-10-11 | 2026-10-12 | 2026-10-13 | Batch 3, P2 (D-056) |
| level_park_3 | 2026-10-11 | 2026-10-12 | 2026-10-13 | Batch 3, P2 (D-056) |
| level_park_4 | 2026-10-11 | 2026-10-12 | 2026-10-13 | Batch 3, P2 (D-056) |
| level_park_5 | 2026-10-11 | 2026-10-12 | 2026-10-13 | Batch 3, P2 (D-056) |
| place_school_map_h | 2026-10-11 | 2026-10-12 | 2026-10-13 | Batch 3, P2 (D-056) |
| place_school_map_v | 2026-10-11 | 2026-10-12 | 2026-10-13 | Batch 3, P2 (D-056) |
| loading_place_school | 2026-10-11 | 2026-10-12 | 2026-10-13 | Batch 3, P2 (D-056) |
| level_school_1 | 2026-10-11 | 2026-10-12 | 2026-10-13 | Batch 3, P2 (D-056) |
| level_school_2 | 2026-10-11 | 2026-10-12 | 2026-10-13 | Batch 3, P2 (D-056) |
| level_school_3 | 2026-10-11 | 2026-10-12 | 2026-10-13 | Batch 3, P2 (D-056) |
| level_school_4 | 2026-10-11 | 2026-10-12 | 2026-10-13 | Batch 3, P2 (D-056) |
| level_school_5 | 2026-10-11 | 2026-10-12 | 2026-10-13 | Batch 3, P2 (D-056) |
| place_club_map_h | 2026-10-11 | 2026-10-12 | 2026-10-13 | Batch 3, P2 (D-056) |
| place_club_map_v | 2026-10-11 | 2026-10-12 | 2026-10-13 | Batch 3, P2 (D-056) |
| loading_place_club | 2026-10-11 | 2026-10-12 | 2026-10-13 | Batch 3, P2 (D-056) |
| level_club_1 | 2026-10-11 | 2026-10-12 | 2026-10-13 | Batch 3, P2 (D-056) |
| level_club_2 | 2026-10-11 | 2026-10-12 | 2026-10-13 | Batch 3, P2 (D-056) |
| level_club_3 | 2026-10-11 | 2026-10-12 | 2026-10-13 | Batch 3, P2 (D-056) |
| level_club_4 | 2026-10-11 | 2026-10-12 | 2026-10-13 | Batch 3, P2 (D-056) |
| level_club_5 | 2026-10-11 | 2026-10-12 | 2026-10-13 | Batch 3, P2 (D-056) |
| place_market_map_h | 2026-10-11 | 2026-10-12 | 2026-10-13 | Batch 3, P2 (D-056) |
| place_market_map_v | 2026-10-11 | 2026-10-12 | 2026-10-13 | Batch 3, P2 (D-056) |
| loading_place_market | 2026-10-11 | 2026-10-12 | 2026-10-13 | Batch 3, P2 (D-056) |
| level_market_1 | 2026-10-11 | 2026-10-12 | 2026-10-13 | Batch 3, P2 (D-056) |
| level_market_2 | 2026-10-11 | 2026-10-12 | 2026-10-13 | Batch 3, P2 (D-056) |
| level_market_3 | 2026-10-11 | 2026-10-12 | 2026-10-13 | Batch 3, P2 (D-056) |
| level_market_4 | 2026-10-11 | 2026-10-12 | 2026-10-13 | Batch 3, P2 (D-056) |
| level_market_5 | 2026-10-11 | 2026-10-12 | 2026-10-13 | Batch 3, P2 (D-056) |
| batch-5 redesign v2 | 2026-10-12 | 2026-10-12 | 2026-10-13 | 4 scenes (land + port), sticker album, 2 mascot poses (D-071). Optional: pages use flat brand colours until approved |
| batch-4 stories (heroes, places, adventures, faces, wand, mascot_reading) | 2026-10-11 | 2026-10-12 | 2026-10-13 | All 26 approved (colleague, OpenAI image tool via Codex; reviewed by Claude Code). `story_shelf`, `scene_story_corner_*`, `story_book_*`, `story_page_paper`, `ui_story_slot` no longer needed after the redesign (D-071) |
| ui_mic_object | 2026-10-10 | 2026-10-13 | 2026-10-13 | Redo delivered: a handheld microphone |
| no longer needed | 2026-10-11 | | | Removed from `design/asset-ids.ts` 2026-10-13 (unused since the redesign, D-071): `story_shelf`, `scene_story_corner_land/_port`, `story_book_open`, `story_page_paper`, `story_book_cover`, `ui_story_slot` |
| batch-6 my room | 2026-10-13 | 2026-10-13 | 2026-10-13 | 2 scenes, 6 room objects, 16 wearable items (D-074); via Codex from assets/requests/batch6/jobs.json into assets/incoming/batch6/ | All 24 approved (reviewed by Claude Code); positions and placements measured |
| batch-7 story experience | 2026-10-13 | 2026-10-13 | 2026-10-13 | 3 action objects + 3 step icons (D-075); via Codex from assets/requests/batch7/jobs.json into assets/incoming/batch7/ |
| batch-8 voice room | 2026-10-14 | 2026-10-15 | 2026-10-15 | 7 mascot activity poses + 3 start objects (D-076); via Codex from assets/requests/batch8/jobs.json into assets/incoming/batch8/. All 10 approved (reviewed by Claude Code, first try each) |
| batch-9 the tower: Nori | 2026-10-20 | 2026-10-20 | 2026-10-23 | Nori character sheet + idle, oops, scared (D-078); via Codex. All 4 approved (reviewed by Claude Code, first try each) |
| batch-10 the tower: the rest | 2026-10-23 | | | 2 Nori poses, tower standing and fallen, block pile, storm cloud, 4 choice pictures (D-078) |
