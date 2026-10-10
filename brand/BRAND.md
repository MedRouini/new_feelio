# Feelio brand guide (DRAFT v2, awaiting owner approval)

> **Status: DRAFT.** Nothing here guides design decisions until the owner approves it (CLAUDE.md).
> v1 was written from the presentation only. v2 (Milestone 0, 2026-10-10) checks every statement against the real files in `brand/` and adds what the product needs.

**Source tags on every statement:**
- **[P]** from the presentation (`feelio - brand presentation.pdf`: one page, 1920 × 17318 pt, all text outlined, 31 embedded raster images).
- **[F]** verified in the asset files (SVG fill/stop values, PNG pixels, or the PDF's vector fill values).
- **[I]** my inference or proposal. These need your yes.

## 0. What changed from v1
| v1 statement | Finding | Action |
|---|---|---|
| Core hex values were "read from the rendered image, verify" | All 8 hex values match the PDF's vector fill colours exactly [F] | Marked verified |
| "Four approved colourways" | The deck shows 4 [P], but files exist for only 2: default (amber→purple) and green (yellow→lime) [F]. Rose→violet and teal→blue are missing | Requested in Open item B1 |
| Logo: four colour treatments use the core colours | The amber logo files use **#FFB703**, not #F3B03A, and the heart is **#9F65ED** in the version with background but **#614194** in the version without [F] | Open item B2 |
| Tints are the logo tile backgrounds | Pink tile is **#FFDAE7** (not #FFD8E6) and blue tile is **#EFF8FF** (not #D4ECFF) [F]. Amber (#FFE6BA) and lilac (#EFCFF8) match | Noted; tokens use the palette tints |
| `brand/fonts/` should hold licences | No `brand/fonts/` folder, no font files, no licences [F] | Open item B3 |
| Face templates are swappable states | Files exist: `excited-face.svg`, `happy-face.svg`, `sad-face.svg`, `mad-face.svg` [F]. The deck calls the last one "angry" [P] | Use id `angry` in code |
| Source files missing (v1 gap 1) | Mostly delivered now: mascot PNG/SVG, face templates, wordmark SVG/PNG ×4, simplified outline logo, heart/cloud/star with faces, sparkle, cloud, blobs, arrow and curve, pattern [F] | Gap list updated (§9) |

## 1. Essence
- "Welcome to the world of Feelio! Feelio is more than just a brand. It's a friendly companion on the journey of understanding emotions." [P]
- The mascot is "a curious and kind being aiming to help children understand their emotions"; by being 'happy', 'sad' or 'excited' it gives kids "a safe and relatable way … to connect with their own feelings." [P]
- Palette intent: "soft, cheerful, and emotionally resonant. Each colour is linked to a feeling." [P] The deck does not say which colour maps to which feeling. [F]
- Tagline "Dream. Explore. Grow." appears only on the "My Learning Journal" merchandise mock-up [P]. Treat it as unofficial until you confirm. [I]
- Mood words: soft, cheerful, emotionally resonant, playful, innocent, friendly. [P]

## 2. Logo
- Custom handwritten wordmark "Feelio" with a heart in place of the dot on the "i". "The heart shape [represents] where all emotions and feelings come from." [P]
- Main lock-up: purple **#614194** wordmark with an amber **#F3B03A** heart. [P][F] (`logotype/svg-no bg/logo color v1.svg`)
- Four colour treatments on tinted tiles [P]. Files [F]:

| File (svg + svg-no bg) | Wordmark | Heart | Tile |
|---|---|---|---|
| `logo color v1` | #614194 purple | #F3B03A | #EFCFF8 |
| `logo color v2` | **#FFB703** (deep amber, not #F3B03A) | **#9F65ED** (bg version) / **#614194** (no-bg version) | #FFE6BA |
| `logo color v3` | #C4557C rose | #F3B03A | #FFDAE7 |
| `logo color v4` | #79B1DE blue | #F3B03A | #EFF8FF |

- PNG exports `logotype/png/IMG_9959–9962.png` (2623 × 1650, transparent): rose, purple, blue, amber. [F]
- Clear space: the deck draws a guide box around the wordmark (about the height of the "e" on every side) but gives no number. [P] **[I] Proposal:** minimum clear space = the height of the heart on all sides; minimum width 96 px on screen.
- **[I] Product use:** the purple v1 lock-up on white or lilac backgrounds; blue and amber wordmarks only at display size (contrast, §4). The wordmark never appears inside mascot or map art.

### Simplified logo
- "A simplified, single-line version of our mascot … for smaller spaces … app icon, merchandise (pencil, pen, pins etc.)." [P]
- Files: `mini-logo-icon.svg` (outline in **#5742A9**, a slightly bluer purple than #614194) and `mini-mascot.png` (348 × 360, transparent). [F]
- **[I]** Use it for the PWA icon and favicon (on a lilac tile), not as a stand-in for the mascot in the child UI.

## 3. Mascot
### Design [P][F]
- Round glossy body, antenna with an amber orb, two stubby arm-flaps, two feet, a dark blue "screen" face with large sparkle eyes and pink cheeks, a pale heart on the belly (#F8DDB0 with a lighter rim), soft highlight ovals on the body, and a small floating highlight at top right. [F]
- Meaning: "The mascot's round shape makes it friendly and approachable. The heart symbolises emotions, the screen represents its chatbot interface, and the spark signifies its AI intelligence." [P] This supports the "I'm an AI friend" disclosure rule. [I]

### Files [F]
| Use | File | Notes |
|---|---|---|
| **Official mascot (reference for every pose prompt)** | `mascot/default/png/IMG_9937.png` | 1321 × 1493 RGBA. The alpha box touches the right edge (x = 1321), so the right arm tip may be cropped. Please check the source export |
| Same, alternate export | `mascot/default/png/IMG_9938.png` | 1321 × 1480, near-identical |
| Body without face (screen blank) | `mascot/default/no face/png/IMG_9964.png` | For "body only + official face" fixes (`docs/MASCOT.md` acceptance) |
| Body without screen | `mascot/default/no face/png/IMG_9963.png` | |
| Green colourway, no face | `mascot/green/png/IMG_9965.png`, `IMG_9966.png` | No green version **with** a face as PNG |
| Vector sources | `mascot/default/svg/*.svg`, `mascot/green/svg/*.svg`, `mascot/default/no face/svg/*.svg` | The files in `no face/svg/` **do contain a face**, so the folder name is misleading. `mascot-shadow*.svg` = with a ground shadow |

### Default colourway gradient (SVG stops) [F]
Body: #FFC32C (top-left highlight) → #D38642 / #E37F49 → #D54F6D → #A4445A → #9C429F / #963689 / #8B338E → #6F279B (feet).
Screen: #85CAF1 (centre glow) → #5C7CBA → #3A3E8D → #291D76 → #05036B (rim). Face outlines and eyes: **#322A6A**. Cheeks: #EE7AC3 / #F69BD4. Eye glints: #FFF7FC, #3FBEDC.

### Colourways [P]
The deck shows four: rose→violet, teal→blue, yellow→lime green, orange/amber→rose→purple (default). Only default and green exist as files [F]. **[I]** In the product, the default colourway is **the** Feelio. Other colourways are not other characters. Proposal: reserve them for the collection (cosmetic "outfits" a child can choose, never paid or earned under pressure) or leave them out of the product.

### Emotions [P][F]
- "Different emotion templates to customise the character['s] feeling each time needed. Playing with the character features (eyes, eyebrows and mouth) to give real emotional feels." [P]
- Four templates: **excited, happy, sad, angry** (`feelings-expressions/*.svg`, about 753 × 460 viewBox each, vector). [F] They exist only as SVG. ChatGPT needs PNG uploads, so the owner exports them as PNG (asset request R-00, `docs/ASSET_REQUESTS.md`).
- Every other state the product needs (listening, thinking, speaking, calm, empathy, proud, confused, sleeping…) does not exist and is requested as owner-generated poses (`docs/MASCOT.md`). [F]

### Companion characters [P][F]
- "Assets": a heart (**#C4557C**), a cloud (**#CCEFFF**) and a star (**#FFC32C**), each with the same kawaii face (eyes #322A6A, cheeks #EE7AC3). Files: `assets/face-svg.svg` (heart), `assets/cloud-face.svg`, `assets/star-face.svg`. [F]
- **[I]** Use them as collectibles in "My collection" and as gentle reward moments. Not as level markers on the map, so they keep their meaning.

### Decorative motifs [P][F]
- Four-point sparkle `assets/star.svg` (**#CEB0FF**), plain cloud `assets/cloud.svg` (white), organic blobs `blob-1/2/3.svg` (#DBF4FF, #F9E7BA, #D6516C), a dashed hand-drawn loop with arrowhead `arrow.svg` and an arc `curve.svg` (both **#FFB703**), and a mascot pattern `Pattern .svg` (contains an embedded raster; the filename has a trailing space). [F]
- **[I]** These are approved brand art, so code may place them (layout, scale, opacity, motion) but must not redraw or recolour them beyond their files.

## 4. Colour
### Core palette [P][F]: verified, each value appears as a vector fill in the PDF
| Role | Base | Tint |
|---|---|---|
| Amber | **#F3B03A** | **#FFE6BA** |
| Rose | **#C4557C** | **#FFD8E6** |
| Purple | **#614194** | **#EFCFF8** |
| Blue | **#79B1DE** | **#D4ECFF** |

### Supporting colours found in the files [F] (not named in the deck)
| Hex | Where | [I] Proposed token |
|---|---|---|
| #322A6A | mascot face outlines and eyes, companion eyes, deck labels | `navy-900`: the dark navy for text |
| #312B7F | font-name labels in the typography section | (same family as navy) |
| #5742A9 | simplified logo outline, dashed loop in "Assets" | `purple-600` (lines, focus rings) |
| #FFB703 | arrow and curve motifs, amber logo variant | `amber-600` (motif lines only) |
| #CEB0FF | sparkle | `lilac-300` |
| #ECE2FF / #EDE2FF / #F3ECFF | page background lilac and cloud fills | `lilac-50`, `lilac-100` |
| #CCEFFF | cloud companion | `sky-100` |
| #FFC32C | star companion, mascot highlight | `star-400` |
| #EE7AC3 | cheeks | (character art only) |
| #8C8B8C | deck body text | **Do not use for text**: 3.39:1 on white fails AA |

### Gradients [P]
"Gradients are a core visual element for the Feelio mascot … a sense of depth and life." Approximate stops, sampled from the rendered swatches (the PDF stores them as shadings) [F, approximate]:
1. **Sky:** #8ECAE5 → #35A6C4 → #1E92B4 → #174380 → #110B58
2. **Rose dusk:** #C4547B → #AC60CC → #A266EC → #5440A8 → #17236D
3. **Sunrise (mascot):** #FDC12C → #F09E3B → #E1774E → #D85866 → #92358B → #762997

**[I]** Use gradients only on the mascot (inside its art), the Talk-screen backdrop glow and a few hero moments (SPEC §4). UI chrome stays flat.

### Contrast (WCAG 2.x, computed 2026-10-10) [F]
| Text colour | on white | on amber tint | on rose tint | on lilac tint | on blue tint | on page lilac #ECE2FF |
|---|---|---|---|---|---|---|
| Navy #322A6A | 12.54 | 10.32 | 9.68 | 8.93 | 10.29 | 10.08 |
| Purple #614194 | 7.80 | 6.42 | 6.02 | 5.55 | 6.40 | 6.27 |
| Rose #C4557C | 4.25 | 3.50 | 3.28 | 3.03 | 3.49 | 3.42 |
| Blue #79B1DE | 2.29 | 1.89 | 1.77 | 1.63 | 1.88 | 1.84 |
| Amber #F3B03A | 1.89 | 1.56 | 1.46 | 1.35 | 1.56 | 1.52 |

White on purple 7.80, white on navy 12.54, white on rose 4.25 (large text only), navy on amber 6.62, purple on amber 4.12 (large text only).

**Rules [I]:**
- Body text: navy #322A6A (child app) or purple #614194. Both pass AA on every tint.
- Rose: large text (≥ 24 px regular or ≥ 18.66 px bold) on white only. It passes 3:1 on the tints, but only for large text.
- Blue and amber: never as text. Shapes, icons and fills only. Non-text UI parts against their background need ≥ 3:1 (WCAG 1.4.11), so amber or blue shapes on white need a navy or purple outline or label.
- Primary button: purple fill with white label (7.80), or amber fill with navy label (6.62).

## 5. Typography
- **Balsamiq Sans**: "our main font for all body text, content, and paragraphs. Its clean and simple style ensures readability." [P]
- **ff yaseer**: "For Arabic text … maintains the same approachable and soft aesthetic." [P]
- **Dreaming Outloud**: "a playful script typeface … can be used for titles in presentation." [P] The deck's section titles are set in it. [F, visual]
- No font files or licences are in `brand/`. [F] Licence findings are in `docs/DECISIONS.md` (D-011) and listed as open item B3.
- **[I] Product rules:**
  - **For now (owner, 2026-10-10; D-023), free OFL fonts only:** Latin UI **Balsamiq Sans** 400/700. Arabic UI **Baloo Bhaijaan 2** (OFL, rounded, close in feel to ff yaseer). Display titles **Balsamiq Sans Bold** (no script font). Mixed strings fall back per script through `font-family` order.
  - Later, with licences bought: ff yaseer replaces Baloo Bhaijaan 2, and Dreaming Outloud may return for large English display titles only (≥ 32 px, never for Arabic, never for content a child must read). A token change, not a code change.
  - Child app base size 20 px (ages 5–8) and 18 px (9–12), line height 1.5. Parent area base 16 px. Text size is a parent setting (SPEC §4).
  - Numerals: Western digits in English. In Arabic, follow the locale setting (Eastern Arabic digits by default; to confirm with Arabic-speaking reviewers).

## 6. Illustration style
- Soft vector illustration: rounded shapes, smooth gradients, glossy highlights on characters, pale pastel backgrounds, sparkles and clouds. [P, visual] [I]
- **The approved global maps** (`assets/approved/map/`) set the world style: bright saturated greens, warm cartoon buildings, soft three-quarter top-down view, light from the top-left. They are more saturated and more detailed than the pastel deck. [F, visual] **[I]** World assets match the map. Mascot assets match the official mascot. UI art (icons, badges) bridges both: brand palette with the map's glossy finish.
- Merchandise photos in the deck (stickers, plush, pin, journal) show real-looking children and products [P]. **[I]** Not for product use.

## 7. Voice and tone (none in the deck) [I], for approval
- **Who Feelio is:** a curious, gentle AI friend from the world of feelings. It is honest that it is an AI ("I'm Feelio, a friendly AI. I'm not a person, but I love hearing about your day").
- **How it speaks:** short sentences (one or two per turn), simple words for the age band, one question at a time, warm and calm. Names feelings without judging them ("It sounds like you felt left out. That can really hurt.").
- **What it celebrates:** effort, kindness, trying again. Never scores, speed or time spent.
- **What it never says:** guilt or pressure ("I'll be sad if you go", "don't leave"), secrecy ("this is just between us"), diagnoses ("you have anxiety"), "I'm your best/only friend", claims of being human, promises it can't keep ("I'll always be here").
- **What it always does:** points to trusted grown-ups, says goodbye warmly, and accepts "no" and silence.
- Arabic: Modern Standard Arabic, simplified for children. Dialect choice is open item B6.

## 8. UI foundations (none in the deck) [I], proposed tokens for Milestone 1
- **Radius:** 12 (inputs), 20 (cards), 28 (sheets), full (pills and round buttons). Rounded like the mascot.
- **Spacing:** 4-pt scale (4, 8, 12, 16, 24, 32, 48, 64).
- **Touch targets:** ≥ 64 px in the child app (SPEC minimum 48; younger children need more), ≥ 44 px in the parent area. Map hotspots ≥ 72 px on screen (`docs/WORLD_PLAN.md`).
- **Elevation:** soft shadow tinted with navy (`0 6px 16px rgb(50 42 106 / 0.15)`), no hard black shadows.
- **Motion:** 150–250 ms ease-out for UI, 400–700 ms spring for mascot reactions. Everything is disabled or replaced by a fade under `prefers-reduced-motion`.
- **Sound:** short, soft cues paired with icons. Fixed audio is pre-generated (SPEC §3.2).
- **Surfaces:** child app on page lilac #F3ECFF or white with lilac cloud shapes. Parent area on white with purple accents, no mascot or a small one.
- **Functional icons:** one library (proposal: Lucide, ISC licence), rounded 2 px stroke in navy. Only for back, close, settings, mic, play/pause, and similar.

## 9. Gaps still open (needed by the product, not in the brand)
1. **Mascot poses and states** beyond the front view: requested in `docs/ASSET_REQUESTS.md` Batch 1 (Batch A) and later batches.
2. **Face templates as PNG** for ChatGPT uploads (R-00).
3. **Two colourways** (rose→violet, teal→blue) as files, if they are kept (B1).
4. **Font files and licences** (B3).
5. **Voice and tone** (§7, proposal) and **UI tokens** (§8, proposal) need approval.
6. **Layered or animatable mascot** (Rive or Lottie) for lip-sync and blinking. Out of scope now: we use pose swaps plus code transforms (`docs/MASCOT.md`).
7. **Usage rules:** minimum sizes, misuse examples (proposal in §2).
8. **Cast sheet** for scenarios: later batch (`docs/ART_DIRECTION.md` §9).

## 10. Open items for the owner (brand)
- **B1** Keep the four colourways in the product? If yes, please add rose→violet and teal→blue files.
- **B2** Amber logo variant: is #FFB703 intended (rather than #F3B03A), and is its heart #614194 or #9F65ED?
- **B3** ~~Font files~~ Resolved for now: free OFL fonts (D-023). Buy the ff yaseer web licence later if you want the exact brand font.
- **B4** Is "Dream. Explore. Grow." an official tagline?
- **B5** Approve §7 voice and tone and §8 UI foundations, or edit them.
- **B6** Arabic register: Modern Standard Arabic only, or a dialect per market?
- **B7** The official mascot PNG may have a cropped right arm (alpha touches the right edge). Re-export with padding if so.
