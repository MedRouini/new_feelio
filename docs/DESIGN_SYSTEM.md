# Feelio design system (child app direction v1, DRAFT for owner approval)

> Applies to every **child-facing** screen. The parent dashboard stays calm and plain (SPEC §4), and is allowed simple panels.
> Brand facts come from `brand/BRAND.md`. Art is never drawn in code (`docs/ASSET_PROTOCOL.md`). Tokens live in one place: `app/globals.css` (`:root`).

## 1. The idea: the world is the interface
Feelio is a **place you are in**, not an app you operate. Every child screen is a scene from Feelio's world:
- the meadow, the map, a place
- with the mascot standing in it
- and **objects** you can touch: a sign, a gate, a drum, a paint pot, a stepping stone

Nothing is a "button in a box". If something is tappable, it is tappable because it looks like a thing.

**The one memorable thing:** the mascot is always physically present and reacts to every touch (hop, wobble, look at it). It is the voice, the guide and the feedback, so the UI around it can stay quiet.

## 2. Rules (from the owner's brief, 2026-10-10)
| Do | Never (in the child app) |
|---|---|
| Scenes from the world, with the mascot in them | Card grids, white panels floating on gradients, glassmorphism |
| Flat colour areas from the palette, big rounded **organic** shapes (meadow mounds, clouds, stones) | Drop shadows or glows as decoration. Depth comes from **layering, scale and motion**; separation from colour or a palette outline |
| Big type, very few words. The mascot **says** it, and captions show it | Small text, thin lines, pastel-on-pastel low contrast |
| Progress shown **in the world**: a path that fills in, a stone that lights up, the mascot celebrating, a companion that joins you | Pill badges, chips, tags, dots, badge rows, scores, counters, progress bars |
| One main action per screen; ≥ 72 px targets; instant sound + movement on every tap | Dashboards, tab bars that look like banking apps, settings lists, default component-library looks |
| Calm, bouncy motion (squash, wobble, settle); reduced motion = gentle fades | Emoji as icons; purple-blue gradient heroes; error screens |
| Portrait, landscape tablet and Arabic RTL each composed on purpose | RTL as a mirrored afterthought (the mascot and art are never mirrored) |

## 3. Tokens (the single source is `app/globals.css`; changes below are proposed for approval)
**Colour:** brand palette, unchanged (BRAND.md §4). Child scenes use:
| Role | Colour | Note |
|---|---|---|
| Sky / air | `--lilac-50` #F3ECFF | Light, calm |
| Ground | the art itself (map greens) | |
| Ink | `--navy-900` #322A6A | All text, all outlines |
| Warm action | `--amber-500` #F3B03A | Navy text on it (6.6:1) |
| Feeling accents | rose #C4557C, sky #79B1DE | Shapes only |
| Status | grey = not yet, amber = now, green = done | BRAND.md §8 |

**Type:**
- Balsamiq Sans for Latin.
- Arabic: **ff yaseer** is the brand font, but it needs a paid web licence (D-011). Until bought, Baloo Bhaijaan 2 (OFL, D-023). This needs your choice (Q-D1).
- Child scale, only 3 sizes:

| Name | Size | Use |
|---|---|---|
| `--fs-say` | 28/36 px | Caption of what the mascot says |
| `--fs-word` | 22/30 px | Object labels, rare |
| `--fs-title` | 40/48 px | Scene name, rare |

- No all-caps. No body text in the child app.

**Shape:**
- No uniform border radius. Shapes come from the art.
- Code-made shapes are only flat blobs, clouds and stones that echo the brand blobs (`brand/assets/blob-*.svg`, used as approved brand art), plus speech bubbles from a delivered frame (Batch 2).

**Outline:** `--outline: 3px solid var(--navy-900)`. Used instead of shadows when something must separate from what's behind it.

**Elevation:** none in the child app. **Proposal:** remove `--shadow-soft` from child components (kept for the parent area only).

**Motion tokens:**
| Token | Value | Use |
|---|---|---|
| `--m-pop` | 160 ms spring, overshoot 1.15 | Tap feedback |
| `--m-settle` | 420 ms spring | Arrival |
| `--m-wobble` | 300 ms | "Not yet" |
| `--m-walk` | 120 px/s | Path walking |
| `--m-idle` | 3.2 s breathing loop | Mascot idle |

All of these collapse to fades under `prefers-reduced-motion`.

**Touch:** `--touch-child: 72px` (was 64). Hit areas can be larger than the visible art.

**Sound tokens:** `tap`, `pick`, `unlock`, `walk-step`, `whoosh`, each ≤ 300 ms and soft. Source to decide (Q-D2). Always paired with motion, never sound alone. Mute lives in the parent settings.

## 4. Honest critique of what already exists (Milestone 1 child screen)
| Element | Verdict | Fix |
|---|---|---|
| "I'm Feelio, a friendly AI" white **pill with a shadow** | On the avoid list (pill chip + shadow) | Becomes a **wooden name sign** held by, or next to, the mascot (delivered blank sign + code-written words), and is also **spoken**. Asset `ui_sign_plate` |
| "Grown-up: set up this device" outlined pill button | Looks like a web button | Becomes a small **grown-up door** object in the corner (press and hold, then the dashboard). Asset `ui_grownup_door` |
| Centred mascot + headline + paragraph on lilac | A template "hero" | Becomes a scene: the welcome meadow with the mascot standing on the ground, a speech bubble frame, and a caption |
| Parent dashboard cards | Fine for adults | Unchanged |

## 5. Component vocabulary (child app)
| Component | Built from | Notes |
|---|---|---|
| `Scene` | Delivered background, portrait and landscape variants; layers in % coordinates | Like the map stage. No page scroll |
| `Mascot` | Pose registry from `assets/manifest.json` + state machine (ARCHITECTURE §8) | Always reacts to taps |
| `SayBubble` | Delivered bubble frame + code text + an audio file | Audio plays, caption shows. Tap to replay |
| `ThingButton` | Any delivered object image as a real `<button>` | Hit area ≥ 72 px, pop on press, sound, localised `aria-label` |
| `Stone` | `node_*` images | Choices that sit on the ground, and level steps |
| `NameSign` | `ui_sign_plate` + code text | AI disclosure, place names, the child's nickname |
| `Avatar` | Composition of delivered layers (ONBOARDING.md §5) | The same component on the map, Talk, stories and collection |
| `GrownUpDoor` | `ui_grownup_door` + press-and-hold (2 s) | Leads to the parent gate. Never the child's main action |

## 6. Screen design notes
Every child screen gets a note here **before** it is built: the idea, the layout in words, the interactions, and the assets it needs. Onboarding notes are in `docs/ONBOARDING.md` §3. The map notes are in `docs/MAP.md` + `docs/ARCHITECTURE.md` §5 and will be revised to this direction before the map UI is built.

## 7. Review routine for every screen
1. Build a first version.
2. Screenshots at phone portrait (390×844), tablet landscape (1180×820), and Arabic RTL on both (Playwright).
3. Check them against the §2 "never" list, and write down what looked templated and what changed.
4. Only then show the owner.

## 8. Open design questions
- **Q-D1 Arabic font:** buy the ff yaseer web licence (from about $80), or keep Baloo Bhaijaan 2 for the pilot?
- **Q-D2 Sound effects:**
  - (a) A free CC0 sound pack (e.g. Kenney "Interface Sounds"). A new third-party asset, so it needs your yes.
  - (b) ElevenLabs sound-effects generation: costs credits, and under-18 use needs approval (D-005).
  - (c) You supply sounds.
- **Q-D3 Remove shadows in the child app:** confirm the token change in §3.
