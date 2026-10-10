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

### dock_map   status: redo (v2 prompt, 2026-10-10)
- Used in: phone-style dock, "Map" button (with a code label and audio cue)
- Purpose: open Feelio's world map. It must read instantly as "map" to a 5-year-old **and** feel like *our* world, not a generic map game
- Size and ratio: 1024×1024 square
- Background: transparent PNG (white if transparency fails). Code draws the rounded tile behind it
- Upload with the prompt: `MAP H` (so the tiny landmarks match our world)
- Save as: `assets/approved/ui/dock_map.png`
- Redo reason (v1): well made but generic: beige paper and a standard location pin, with nothing from Feelio's world or brand
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached our game's world map: use it as the reference for the tiny buildings. A game app icon: a small folded paper map, partly open, with lilac-tinted paper edges (#EFCFF8) and a pale cream inside. On the map, a winding beige path connects three tiny, chunky, simplified landmarks copied from the attached map: the cosy house with the red roof, the yellow school with the round clock, and a market stall with a red-and-white striped awning, plus a small blue pond. Standing on the path is a plump **heart-shaped map pin** in rose (#C4557C) with a warm amber (#F3B03A) glow, instead of a normal location pin. Keep it simple and bold: few details, big shapes. Dock icon set style (identical for all four dock icons): a single chunky object, slightly tilted three-quarter view, soft rounded shapes, a smooth deep-purple outline (#614194) of even thickness around the whole object, gentle glossy highlight on the upper left, soft pastel gradients, no drop shadow, centred and filling about 80% of the square, readable at 64 px. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh greens. Flat 2D vector-style illustration for a children's mobile game, friendly kawaii style; not 3D, not photorealistic. Culturally neutral. No text, no letters, no numbers, no signs with writing, no logos, no watermark, no characters, no people.

### dock_talk   status: requested
- Used in: phone-style dock, "Talk" button (opens the voice companion)
- Purpose: shows that Talk means talking with Feelio
- Size and ratio: 1024×1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `OFFICIAL MASCOT`, `mascot_idle` (approved), `dock_map` (approved, for icon style)
- Save as: `assets/approved/ui/dock_talk.png`
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached the official mascot, an approved pose of it, and an approved icon for style. A single game icon, centred, filling about 80% of the frame, no tile or background shape: the head and upper body of the attached mascot (keep it identical: antenna with amber orb, dark blue screen face with sparkle eyes, pink cheeks, same colours and glossy style), happy face with a small open smile, next to a rounded pale lilac (#EFCFF8) speech bubble with three soft purple dots inside.  Dock icon set style (identical for all four dock icons): a single chunky object, slightly tilted three-quarter view, soft rounded shapes, a smooth deep-purple outline (#614194) of even thickness around the whole object, gentle glossy highlight on the upper left, soft pastel gradients, no drop shadow, centred and filling about 80% of the square, readable at 64 px. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh greens. Flat 2D vector-style illustration for a children's mobile game, friendly kawaii style; not 3D, not photorealistic. Culturally neutral.

### dock_stories   status: requested
- Used in: phone-style dock, "Stories" button
- Purpose: icon for the storybook feature
- Size and ratio: 1024×1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `dock_map` (approved v2, as the set's style reference)
- Save as: `assets/approved/ui/dock_stories.png`
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached an approved icon; match its style exactly. A single game icon object, centred, filling about 80% of the frame, no tile or background shape: an open storybook with a soft purple (#614194) rounded cover and cream pages, a few small four-point sparkles in lilac and amber rising from the pages. The pages are completely blank: no writing, no scribbles, no pictures.  Dock icon set style (identical for all four dock icons): a single chunky object, slightly tilted three-quarter view, soft rounded shapes, a smooth deep-purple outline (#614194) of even thickness around the whole object, gentle glossy highlight on the upper left, soft pastel gradients, no drop shadow, centred and filling about 80% of the square, readable at 64 px. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh greens. Flat 2D vector-style illustration for a children's mobile game, friendly kawaii style; not 3D, not photorealistic. Culturally neutral. Culturally neutral. No text, no letters, no numbers, no logos, no watermark, no characters.

### dock_collection   status: requested
- Used in: phone-style dock, "My collection" button
- Purpose: icon for collected mascot moments and companions
- Size and ratio: 1024×1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `dock_map` (approved v2, as the set's style reference), `companion_heart.png`, `companion_cloud.png`, `companion_star.png` (from R-00)
- Save as: `assets/approved/ui/dock_collection.png`
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached an approved icon for style and three small brand characters (a heart, a cloud and a star with cute faces). A single game icon, centred, filling about 80% of the frame, no tile or background shape: a rounded keepsake box in soft rose (#FFD8E6 with #C4557C trim), lid open, with the three attached characters peeking out happily, kept identical to the attachments in shape, colour and face.  Dock icon set style (identical for all four dock icons): a single chunky object, slightly tilted three-quarter view, soft rounded shapes, a smooth deep-purple outline (#614194) of even thickness around the whole object, gentle glossy highlight on the upper left, soft pastel gradients, no drop shadow, centred and filling about 80% of the square, readable at 64 px. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh greens. Flat 2D vector-style illustration for a children's mobile game, friendly kawaii style; not 3D, not photorealistic. Culturally neutral.

### badge_lock   status: requested
- Used in: global map (locked place), place card (locked level node overlay)
- Purpose: a friendly "not yet" marker, never scary or punishing
- Size and ratio: 1024×1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `dock_map` (approved)
- Save as: `assets/approved/ui/badge_lock.png`
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached an approved icon; match its style. A single chunky, rounded padlock badge, closed, in soft lilac and purple (#EFCFF8 body with #614194 shading and a small amber #F3B03A keyhole), a gentle glossy shine, centred, filling about 75% of the frame. Friendly and soft, not scary, not metallic grey. Flat 2D vector-style illustration for a children's mobile game, clean rounded shapes, minimal shading, friendly kawaii style; not 3D, not photorealistic. No face, no text, no letters, no numbers, no logos, no watermark, no characters.

### badge_star   status: requested
- Used in: global map (completed place), place card (completed level)
- Purpose: gentle "you did it" marker (effort, not score)
- Size and ratio: 1024×1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `badge_lock` (approved)
- Save as: `assets/approved/ui/badge_star.png`
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached an approved badge; match its style, size and finish exactly. A single plump five-point star with softly rounded tips, warm yellow-amber (#FFC32C to #F3B03A) with a glossy highlight on the upper left, centred, filling about 75% of the frame. No face on the star. Flat 2D vector-style illustration for a children's mobile game, clean rounded shapes, minimal shading, friendly kawaii style; not 3D, not photorealistic. No text, no letters, no numbers, no logos, no watermark, no characters.

### badge_check   status: requested
- Used in: place card (finished scenario inside a level), collection
- Purpose: a small "done" mark that is calmer than the star
- Size and ratio: 1024×1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `badge_lock` (approved), `badge_star` (approved)
- Save as: `assets/approved/ui/badge_check.png`
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached two approved badges; match their style, size and finish exactly. A single round badge: a soft purple (#614194) disc with a lighter lilac rim and a thick, rounded white checkmark in the middle, gentle glossy highlight on the upper left, centred, filling about 75% of the frame. Flat 2D vector-style illustration for a children's mobile game, clean rounded shapes, minimal shading, friendly kawaii style; not 3D, not photorealistic. No face, no text, no letters, no numbers, no logos, no watermark, no characters.

### node_locked   status: requested
- Used in: place card, level node in the locked state (code adds the level number and `badge_lock`)
- Purpose: base button art for the level path inside the place card
- Size and ratio: 1024×1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `MAP H` (the round stone pads are the style reference), `badge_lock` (approved)
- Save as: `assets/approved/ui/node_locked.png`
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached our game map (look at the round stone pads on the path) and an approved badge for finish. A single round game level button seen from slightly above, like a thick rounded stepping stone with a flat empty top and a soft darker rim, in muted lilac-grey (#DCD3EC top, #B9AED3 rim), with a gentle highlight. The top face is completely empty (no number, no symbol, no lock). Centred, filling about 80% of the frame, no ground shadow. Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, minimal shading, friendly kawaii style; not 3D, not photorealistic. No text, no letters, no numbers, no logos, no watermark, no characters.

### node_current   status: requested
- Used in: place card, the level the child plays next
- Purpose: inviting, warm "play me" state (code adds the number and a soft pulse)
- Size and ratio: 1024×1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `node_locked` (approved)
- Save as: `assets/approved/ui/node_current.png`
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached an approved level button. Keep exactly the same shape, size, angle and finish, and change only the colours: a warm amber top (#F3B03A to #FFC32C) with a deeper orange-rose rim (#E1774E), and a soft warm glow around the edge. The top face stays completely empty. Centred, same framing as the attachment, no ground shadow. No text, no letters, no numbers, no symbols, no logos, no watermark, no characters.

### node_completed   status: requested
- Used in: place card, finished level (code adds the number and `badge_star`)
- Purpose: calm "done, replay any time" state
- Size and ratio: 1024×1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `node_locked` (approved)
- Save as: `assets/approved/ui/node_completed.png`
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached an approved level button. Keep exactly the same shape, size, angle and finish, and change only the colours: a soft purple top (#7A5AB0 to #614194) with a lighter lilac rim (#EFCFF8). The top face stays completely empty. Centred, same framing as the attachment, no ground shadow. No text, no letters, no numbers, no symbols, no logos, no watermark, no characters.

### mascot_head_happy   status: requested
- Used in: the "I'm Feelio, a friendly AI" chip (Talk screen, onboarding), small avatar buttons, place-card speech line
- Purpose: a small avatar that reads clearly at 32–64 px
- Size and ratio: 1024×1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `OFFICIAL MASCOT`, `mascot_idle` (approved), `FACE: happy`
- Save as: `assets/approved/mascot/mascot_head_happy.png`
- Prompt (paste into ChatGPT):
  > Create an image. I attached the official mascot, an approved pose, and its official happy face. Keep this exact character: same design, proportions, colours, glossy kawaii vector style, antenna with amber orb, dark blue screen face with sparkle eyes, pink cheeks. Show only the head and upper body, from the top of the antenna orb down to just below the screen face (the belly heart is not visible), facing the viewer, centred, filling about 85% of the frame. [FACE: use the attached happy face exactly.] Transparent background PNG (plain white if transparency fails), 1024×1024, no ground shadow, no props, no text, no letters, no other characters. Flat 2D vector-style illustration for a children's mobile game, gentle glossy highlights, friendly kawaii style; not 3D, not photorealistic. No logos, no watermark.

### Priority 2: Milestone 1b reactions and shell states

### mascot_happy   status: requested
- Used in: map (place completed), place card, scenario feedback later
- Purpose: warm happiness, calmer than excited
- Size and ratio: 1024×1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `OFFICIAL MASCOT`, `mascot_idle` (approved), `FACE: happy`
- Save as: `assets/approved/mascot/mascot_happy.png`
- Prompt (paste into ChatGPT):
  > Create an image. I attached the official mascot, an approved pose of it, and its official happy face. Keep this exact character: same design, proportions, colours, glossy kawaii vector style, antenna with amber orb, dark blue screen face with sparkle eyes, pink cheeks, heart on the belly, stubby arms and feet. Change only the pose and expression: [POSE: standing, arm-flaps lifted slightly outward and open as if saying "yay", body leaning a little to one side] and [FACE: the attached happy face, eyes slightly curved with joy]. Full body, centred, transparent background PNG (plain white if transparency fails), 1024×1024, no ground shadow, no props, no text, no letters, no other characters. Flat 2D vector-style illustration for a children's mobile game, gentle glossy highlights, friendly kawaii style; not 3D, not photorealistic. No logos, no watermark.

### mascot_excited   status: requested
- Used in: map (tapping the mascot or an unlocked place, new place unlocked)
- Purpose: big positive reaction. Never used in crisis or sad moments (`docs/MASCOT.md`)
- Size and ratio: 1024×1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `OFFICIAL MASCOT`, `mascot_idle` (approved), `FACE: excited`
- Save as: `assets/approved/mascot/mascot_excited.png`
- Prompt (paste into ChatGPT):
  > Create an image. I attached the official mascot, an approved pose of it, and its official excited face. Keep this exact character: same design, proportions, colours, glossy kawaii vector style, antenna with amber orb, dark blue screen face with sparkle eyes, pink cheeks, heart on the belly, stubby arms and feet. Change only the pose and expression: [POSE: a small happy hop with both feet just off the ground, both arm-flaps raised high, antenna bouncing] and [FACE: the attached excited face exactly: big sparkle eyes and an open smile]. Full body, centred, transparent background PNG (plain white if transparency fails), 1024×1024, no ground shadow, no motion lines, no confetti, no props, no text, no letters, no other characters. Flat 2D vector-style illustration for a children's mobile game, gentle glossy highlights, friendly kawaii style; not 3D, not photorealistic. No logos, no watermark.

### mascot_waving   status: requested
- Used in: hello at app start and onboarding; goodbye at the end of a session or when the time limit is reached (warm, never pleading)
- Purpose: greeting and farewell
- Size and ratio: 1024×1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `OFFICIAL MASCOT`, `mascot_idle` (approved), `FACE: happy`
- Save as: `assets/approved/mascot/mascot_waving.png`
- Prompt (paste into ChatGPT):
  > Create an image. I attached the official mascot, an approved pose of it, and its official happy face. Keep this exact character: same design, proportions, colours, glossy kawaii vector style, antenna with amber orb, dark blue screen face with sparkle eyes, pink cheeks, heart on the belly, stubby arms and feet. Change only the pose and expression: [POSE: waving hello with one arm-flap raised high above its side, the other arm-flap relaxed, body tilted slightly toward the raised arm] and [FACE: the attached happy face, friendly and calm]. Full body, centred, transparent background PNG (plain white if transparency fails), 1024×1024, no ground shadow, no props, no text, no letters, no other characters. Flat 2D vector-style illustration for a children's mobile game, gentle glossy highlights, friendly kawaii style; not 3D, not photorealistic. No logos, no watermark.

### mascot_idle_blink   status: requested
- Used in: idle loop everywhere (swapped in for about 150 ms every few seconds)
- Purpose: makes the idle mascot feel alive without drawing in code
- Size and ratio: 1024×1024 square, **pixel-aligned with `mascot_idle`**
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `mascot_idle` (approved)
- Save as: `assets/approved/mascot/mascot_idle_blink.png`
- Prompt (paste into ChatGPT):
  > Edit the attached image. Keep everything exactly identical (same character, same pose, same size, same position in the frame, same colours and highlights) and change only the eyes on the screen face: both eyes gently closed, drawn as soft downward-curved lines in the same dark navy, like a blink. The smile and cheeks stay the same. Transparent background PNG (plain white if transparency fails), 1024×1024. No text, no letters, no other changes.

### ring_current   status: requested
- Used in: global map, under the current place (code adds a slow pulse), and around the current level node
- Purpose: marks "you are here" softly
- Size and ratio: 1024×1024 square
- Background: transparent PNG, **transparent centre**
- Upload with the prompt: `MAP H`, `badge_star` (approved)
- Save as: `assets/approved/ui/ring_current.png`
- Prompt (paste into ChatGPT):
  > Create an image. Square 1:1, transparent background. I attached our game map and an approved badge for style. A single soft glowing ring lying flat on the ground, seen from slightly above at the same camera angle as the map (so it looks like a wide oval), made of a warm amber-to-rose glow (#F3B03A to #C4557C) with a few tiny four-point sparkles in lilac (#CEB0FF) along it. The middle of the ring is completely empty and transparent. Centred, filling about 85% of the frame width. Flat 2D vector-style illustration for a children's mobile game, soft gradients, gentle glow; not 3D, not photorealistic. No text, no letters, no numbers, no logos, no watermark, no characters.

### mascot_sleeping   status: requested
- Used in: offline state of the PWA, "come back tomorrow" when the daily time is used up (calm, not sad)
- Purpose: a restful, positive "resting now" state
- Size and ratio: 1024×1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `OFFICIAL MASCOT`, `mascot_idle` (approved)
- Save as: `assets/approved/mascot/mascot_sleeping.png`
- Prompt (paste into ChatGPT):
  > Create an image. I attached the official mascot and an approved pose of it. Keep this exact character: same design, proportions, colours, glossy kawaii vector style, antenna with amber orb, dark blue screen face, pink cheeks, heart on the belly, stubby arms and feet. Change only the pose and expression: [POSE: sitting down peacefully, body slightly slumped and relaxed, arm-flaps resting on its belly, antenna drooping gently] and [FACE: eyes closed as soft curved lines, a tiny peaceful smile, cheeks a little rosier, looking content and cosy, not sad]. Full body, centred, transparent background PNG (plain white if transparency fails), 1024×1024, no ground shadow, no pillow, no blanket, no "Z" letters, no props, no text, no letters, no other characters. Flat 2D vector-style illustration for a children's mobile game, gentle glossy highlights, friendly kawaii style; not 3D, not photorealistic. No logos, no watermark.

### mascot_confused   status: requested
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

### mascot_listening   status: requested
- Used in: Talk screen, while the child speaks (ElevenLabs mode = listening)
- Purpose: shows "I'm listening to you" clearly to a child who can't read
- Size and ratio: 1024×1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `OFFICIAL MASCOT`, `mascot_idle` (approved)
- Save as: `assets/approved/mascot/mascot_listening.png`
- Prompt (paste into ChatGPT):
  > Create an image. I attached the official mascot and an approved pose of it. Keep this exact character: same design, proportions, colours, glossy kawaii vector style, antenna with amber orb, dark blue screen face with sparkle eyes, pink cheeks, heart on the belly, stubby arms and feet. Change only the pose and expression: [POSE: head and body tilted slightly to one side, one arm-flap raised and cupped near the side of the screen face as if listening carefully, leaning in a little toward the viewer] and [FACE: attentive open sparkle eyes, eyebrows gently raised, a small closed soft smile]. Full body, centred, transparent background PNG (plain white if transparency fails), 1024×1024, no ground shadow, no sound waves, no props, no text, no letters, no other characters. Flat 2D vector-style illustration for a children's mobile game, gentle glossy highlights, friendly kawaii style; not 3D, not photorealistic. No logos, no watermark.

### mascot_thinking   status: requested
- Used in: Talk screen, between the end of the child's speech and the first reply audio
- Purpose: covers the latency gap with a readable "thinking" state
- Size and ratio: 1024×1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `OFFICIAL MASCOT`, `mascot_idle` (approved)
- Save as: `assets/approved/mascot/mascot_thinking.png`
- Prompt (paste into ChatGPT):
  > Create an image. I attached the official mascot and an approved pose of it. Keep this exact character: same design, proportions, colours, glossy kawaii vector style, antenna with amber orb, dark blue screen face with sparkle eyes, pink cheeks, heart on the belly, stubby arms and feet. Change only the pose and expression: [POSE: standing, one arm-flap raised to touch the bottom edge of its screen face like a hand on the chin, the antenna orb glowing a little brighter] and [FACE: eyes looking up and to the side, a small round "o" mouth, thoughtful and calm]. Full body, centred, transparent background PNG (plain white if transparency fails), 1024×1024, no ground shadow, no thought bubble, no symbols, no props, no text, no letters, no other characters. Flat 2D vector-style illustration for a children's mobile game, gentle glossy highlights, friendly kawaii style; not 3D, not photorealistic. No logos, no watermark.

### mascot_speaking_half   status: requested
- Used in: Talk screen while the agent speaks; the **base frame** for the three mouth frames (generate this one first)
- Purpose: speaking pose with a half-open mouth
- Size and ratio: 1024×1024 square
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `OFFICIAL MASCOT`, `mascot_idle` (approved), `FACE: happy`
- Save as: `assets/approved/mascot/mascot_speaking_half.png`
- Prompt (paste into ChatGPT):
  > Create an image. I attached the official mascot, an approved pose of it, and its official happy face. Keep this exact character: same design, proportions, colours, glossy kawaii vector style, antenna with amber orb, dark blue screen face with sparkle eyes, pink cheeks, heart on the belly, stubby arms and feet. Change only the pose and expression: [POSE: standing facing the viewer, one arm-flap raised a little in a friendly explaining gesture, the other relaxed] and [FACE: warm open sparkle eyes, mouth half open as if in the middle of saying a word]. Full body, centred, transparent background PNG (plain white if transparency fails), 1024×1024, no ground shadow, no speech bubble, no props, no text, no letters, no other characters. Flat 2D vector-style illustration for a children's mobile game, gentle glossy highlights, friendly kawaii style; not 3D, not photorealistic. No logos, no watermark.

### mascot_speaking_closed   status: requested
- Used in: Talk screen mouth frame at low output volume
- Purpose: lip-sync frame (swapped by audio level in code)
- Size and ratio: 1024×1024 square, **pixel-aligned with `mascot_speaking_half`**
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: `mascot_speaking_half` (approved)
- Save as: `assets/approved/mascot/mascot_speaking_closed.png`
- Prompt (paste into ChatGPT):
  > Edit the attached image. Same pose and body as the attached pose image, only the mouth changes: closed, a small soft smile. Keep everything else exactly identical: same size, same position in the frame, same eyes, cheeks, colours and highlights. Transparent background PNG (plain white if transparency fails), 1024×1024. No text, no letters, no other changes.

### mascot_speaking_open   status: requested
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
| dock_map | 2026-10-10 | v1 seen 2026-10-10 | | P1. **Redo** with the v2 prompt (v1 too generic); generate first in the icons chat |
| dock_talk | 2026-10-10 | | | P1 |
| dock_stories | 2026-10-10 | | | P1 |
| dock_collection | 2026-10-10 | | | P1 |
| badge_lock | 2026-10-10 | | | P1 |
| badge_star | 2026-10-10 | | | P1 |
| badge_check | 2026-10-10 | | | P1 |
| node_locked | 2026-10-10 | | | P1 |
| node_current | 2026-10-10 | | | P1 |
| node_completed | 2026-10-10 | | | P1 |
| mascot_head_happy | 2026-10-10 | | | P1 |
| mascot_happy | 2026-10-10 | | | P2 |
| mascot_excited | 2026-10-10 | | | P2. Optional now: `mascot_feel_excited` covers the map tap reaction; generate the hop version only if you want more motion |
| mascot_waving | 2026-10-10 | | | P2 |
| mascot_idle_blink | 2026-10-10 | | | P2 |
| ring_current | 2026-10-10 | | | P2 |
| mascot_sleeping | 2026-10-10 | | | P2 (from Batch B, needed for the offline shell) |
| mascot_confused | 2026-10-10 | | | P2 (from Batch B, needed for error states) |
| mascot_feel_excited | 2026-10-10 | 2026-10-10 | 2026-10-10 | P2b, face swap on mascot_idle. Approved |
| mascot_feel_sad | 2026-10-10 | 2026-10-10 | 2026-10-10 | P2b, face swap on mascot_idle. Approved |
| mascot_feel_angry | 2026-10-10 | 2026-10-10 | 2026-10-10 | P2b, face swap on mascot_idle; naming only. Approved |
| mascot_listening | 2026-10-10 | | | P3 (voice) |
| mascot_thinking | 2026-10-10 | | | P3 (voice) |
| mascot_speaking_half | 2026-10-10 | | | P3 (voice), base for the mouth frames |
| mascot_speaking_closed | 2026-10-10 | | | P3 (voice) |
| mascot_speaking_open | 2026-10-10 | | | P3 (voice) |
