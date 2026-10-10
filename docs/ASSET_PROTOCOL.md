# Visual asset protocol (read before building any screen)

Visuals are central to Feelio. Children judge the product by how it looks and feels, so every illustration, character, icon set and scene must be real, designed art, not code-drawn approximations.

## The rule
**Claude Code never draws visual assets.** That means:
- No hand-written SVG, canvas or CSS illustrations of the mascot, characters, places, objects, backgrounds, badges, stickers or decorative art.
- No emoji or stock-icon stand-ins for illustrative assets.
- No "temporary" drawn versions that might ship.

**Allowed in code:** layout, flat colours and brand gradients, typography, borders, shadows, motion, masks and filters applied to delivered images, and plain functional UI icons (back, close, settings, microphone, play/pause) from one standard icon library. Playful assets such as the phone dock icons, level badges, lock and star are **not** functional icons; request them.

## How assets are produced
The owner generates assets with ChatGPT image generation and drops them into `assets/approved/`. Claude Code writes the prompts.

Whenever you need an asset (a mascot pose, a button, a badge, a place card, a background, a story frame, an empty-state illustration, a loading animation frame, anything visual):
1. **Stop short of building a stand-in.** Add an entry to `docs/ASSET_REQUESTS.md` and keep going with a grey labelled box (CSS only) marked `TODO(PLACEHOLDER): asset <id>`.
2. **Give a ready-to-paste prompt** (see the format below). Batch requests per milestone, highest priority first, so the owner can generate many in one sitting.
3. **Say which images the owner must upload** with the prompt (always the official mascot for mascot assets, and the approved map or a previously approved asset for style).
4. When the owner delivers a file, view it yourself, check it against the rejection list, record it in `assets/manifest.json`, wire it in, and replace the placeholder. Tell the owner if it needs a redo and why, with an adjusted prompt.

## Request format (one block per asset in `docs/ASSET_REQUESTS.md`)
```
### <asset-id>   status: requested | delivered | approved | redo
- Used in: <screen / feature / state>
- Purpose: <one line>
- Size and ratio: <e.g. 1024x1024 square, 1536x1024 landscape, 1024x1536 portrait>
- Background: transparent PNG (white if transparency fails)
- Upload with the prompt: <official mascot | approved map | asset-id of approved style reference>
- Save as: assets/approved/<folder>/<filename>.png
- Prompt (paste into ChatGPT):
  > ...
```

## Prompt rules
- Start with: "Create an image." State the aspect ratio and transparent background.
- Always include the shared style block below, so every asset matches.
- For mascot assets: "I attached the official mascot. Keep it identical in design, colours and proportions. Change only the pose and expression: ..."
- For anything that must match the world: "I attached the approved map. Match its art style, colours, camera angle and level of detail."
- End with: "No text, no letters, no logos, no watermark, no extra characters." Add "no people" for scenes.
- One asset per request, except sprite sheets (a grid, with generous spacing), which the owner crops.
- Ask for sizes with room to scale down: sprites 1024×1024 or larger.

### Shared style block
> Flat 2D vector-style illustration for a children's mobile game, soft pastel gradients, clean rounded shapes, gentle glossy highlights on characters, minimal shading, friendly kawaii style; not 3D, not photorealistic. Palette: amber #F3B03A, rose #C4557C, purple #614194, sky blue #79B1DE, with tints #FFE6BA, #FFD8E6, #EFCFF8, #D4ECFF, plus fresh natural greens. Culturally neutral.

## Rejection checklist (Claude Code applies it to every delivered asset)
Text or letters; wrong or drifted mascot (antenna orb, screen face with sparkle eyes, pink cheeks, belly heart, stubby arms and feet, correct colourway); extra characters; style different from the approved map; halos or white fringes on transparent PNGs; cropped subject; wrong pose for the request; unsafe or age-inappropriate content.

## Two kinds of images (do not mix them up)
- **Brand and world assets** (mascot, map, icons, badges, frames, backgrounds): made by the owner in ChatGPT, approved once, reused.
- **Per-story illustrations** (the four pages of a generated story): generated at run time by the product through the image model configured in the spec, and always through the safety layer. The mascot is never generated inside these; it is composited as an approved sticker where the design wants it.

## Assets folder layout
`assets/approved/map/`, `assets/approved/mascot/`, `assets/approved/ui/`, `assets/approved/world/`, `assets/approved/stories/`. Anything unapproved stays out of `public/`. `assets/manifest.json` lists every file: id, prompt, tool, date, chat link, approved flag.
