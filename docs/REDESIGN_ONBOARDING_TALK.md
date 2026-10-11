# Redesign: Onboarding journey and Talk (approved and built 2026-10-11, D-069)

Owner brief (2026-10-11): make onboarding and Talk feel like a polished children's game, not forms; the approved illustrations are the stars; confirm choices instead of auto-advancing; an interactive avatar picker; topics as exploration; a magical gate; a better nickname step; fix sign text everywhere; remove the companion step; an immersive, brand-true voice screen.

Built as proposed. Owner answers to the **(decide)** points: companion hidden everywhere; flat brand shapes OK; no new interest voice lines (captions only); gate without door assets.

## 0. What is wrong today (review)
| Area | Today | Problem |
|---|---|---|
| Flow | Each stop swaps its contents instantly; colour and companion picks auto-advance after 0.9 s | Feels like separate pages; a child can't change their mind |
| Character | 4 small characters in a row + a preview above | The characters are small; the picker reads as a form |
| Companion | A whole sub-step | Low value (your call: remove) |
| Names | 6 wooden-sign buttons, text positioned by guess (`top: 22%`) | Signs used as buttons look odd; text not centred on the board |
| Likes | A 4×2 grid of pictures | Static; no sense of exploring; choices give little feedback |
| Gate | The "open" scene fades in through an **elliptical mask** around the gate | The soft ellipse blurs the edge of the art and looks patched; no sense of entering |
| Talk | Mascot + a bubble + a pill button | Generic; no listening/thinking/speaking feeling; no voice-reactive motion; error states are text only |

Measured: the open-gate scenes are **identical to the closed ones outside the gate** (mean difference 1 to 5 out of 255 per region, only compression noise). So the gate can open with a **full-picture crossfade**: no mask, nothing distorted.

## 1. The journey: one continuous scene
The meadow is the whole onboarding. It never reloads; only the camera, the mascot and the objects in it change.

- **Camera walk.** At each stop the meadow picture gently zooms and pans toward the gate (about 1.00 → 1.06 → 1.12 → 1.18 scale, 600 ms ease). By the last stop the gate is close. The art is only scaled, never stretched or recoloured.
- **Feelio walks with you.** Between stops Feelio plays `mascot_walking_right` (`walking_left` in Arabic) for a short hop-walk, then turns back to its stop pose. With reduced motion: a simple cross-fade, no walking or zoom.
- **Objects arrive, not pages.** A stop's objects pop in one after another (staggered 60 ms, a small spring), and leave with a quick shrink before the walk. One choreographed moment per change, no constant motion.
- **Progress, without numbers.** Four small stepping stones at the top (the approved `node_locked` / `node_current` / `node_completed` art) light up as you go: the same language as the map.
- **Confirm, never auto-advance.** Choosing gives instant feedback (hop, sound, sparkle) and Feelio's reaction. The big "go on" stone (`node_current` + arrow) appears **only once a choice exists**, with a gentle "breathing" pulse. Children can change their mind as often as they like.

New order (companion step removed): **1 Hello (AI disclosure) → 2 Your character → 3 Your name → 4 What you like → 5 Microphone (only if Talk is on) → 6 The gate.**

## 2. Character picker (stop 2)
```
 landscape                                              portrait
 ┌──────────────────────────────────────────────┐       ┌──────────────────┐
 │ [stones ● ● ○ ○ ○]            ( bubble )  [door]│       │ ●●○○○      [door]│
 │                                               │       │   ( bubble )     │
 │  FEELIO      ‹   ◌small   ◉ BIG   ◌small   ›  │       │                  │
 │  pointing          (stone podium under it)    │       │ ‹ ◌  ◉BIG  ◌ ›   │
 │                     • • ● •                    │       │    • • ● •       │
 │                                   (go stone)  │       │ FEELIO  (go)     │
 └──────────────────────────────────────────────┘       └──────────────────┘
```
- **A stage carousel.** The chosen character stands **big** in the centre on a podium (the approved `node_current` stone), the neighbours smaller and softer on each side. Swipe, tap a neighbour, or use the big ‹ › arrows (functional icons) to bring one to the centre.
- **Feedback.** The centred character does a happy hop and a squash-and-stretch landing, with three brand companions (`companion_star/heart/cloud`, approved art) twinkling around it for a moment, and a "pick" sound. Feelio turns to look at it.
- **Clear selection.** The centre is the choice; dots under the stage show where you are.
- **Confirm.** The go stone (with a tick) appears once the child has touched the picker at least once.
- **Data:** only `colour` changes (one character, D-053). The companion is no longer chosen: it defaults to `star` and is **hidden everywhere** (map, Talk, collection) until we bring it back **(decide)**.

## 3. Name (stop 3), new interaction
Signs stop being buttons. The wooden sign becomes **the result**: the child's character holds one sign, and the chosen name lands on it.
- **Name balloons.** Six or seven names float gently in the sky above the meadow as **soft rounded balloons in brand colours** (flat CSS shapes with the brand palette, allowed by the asset protocol; no drawn illustration), each with its name in large type. A little bob, never busy.
- **Tap a balloon:** it floats down onto the character's sign, Feelio says "Hi, Pip!", and the sign does a small wobble. Tap another to swap.
- **The parent's nickname**, if set, is the first balloon (shown, never sent to any AI, as today).
- **Confirm** with the go stone.

**Sign text fix (everywhere: AI sign, the child's name, place names, collection).** Measure the blank board area in `ui_sign_plate` from the art itself (the board without its posts), and position the text in exactly that box. Text auto-fits: one line if it fits, otherwise two balanced lines, shrinking down to a minimum size, never overflowing. Checked with screenshots in English and Arabic on phone and tablet.

## 4. What you like (stop 4), exploring
```
        ‹    [music]   [ SPACE ]   [drawing]    ›
              small     big, hops    small
                       "Space!"  (Feelio says it)
                      ( ♥ I like it )      ← one big toggle under the centre item
   your picks:  [🚀]  [ ]  [ ]            ← three slots near Feelio; picks fly here
```
- **An interest carousel**, the same feel as the character stage: the centred picture is big, its neighbours peek in from the sides; swipe or arrow to explore all eight.
- **Each picture has its moment.** When it reaches the centre it does a small idle motion of its own (a rocket nudges upward, a ball bounces, the fish sways), done with transforms on the approved picture only, and Feelio names it. (Fixed words: their audio can be pre-generated once, about 8 short lines per language, when you approve. **(decide)**)
- **Choose with one big button** under the centre ("I like it", a heart icon). The picture flies into one of **three pick slots** beside Feelio, with a sparkle. Tap a slot to put it back.
- **Confirm** with the go stone (allowed with 0 to 3 picks; zero is fine).
- **Accessibility:** arrows and dots are real buttons with labels; all eight are reachable by keyboard and screen reader; the carousel never auto-scrolls.

## 5. Microphone (stop 5), only when Talk is on
Kept, restyled with the redone microphone art (`ui_mic_object`, on redo). Tapping it shows a ring that grows with the child's own voice (local only, nothing sent), and Feelio's "I heard you!" with `mascot_listening`. If the microphone is refused: a calm "Ask a grown-up to help" with a retry, never a dead end.

## 6. The gate (stop 6), entering the world
1. Tap the go stone at the gate. Feelio turns toward it (`mascot_pointing`).
2. **The gate opens:** the whole meadow cross-fades from the closed picture to the open one in 600 ms. Both are the approved art; nothing is masked or distorted.
3. **Light spills out:** a soft warm glow (a brand-amber radial gradient, CSS only) swells inside the gateway, and a few approved companion stars twinkle up from it.
4. **Push through:** the camera zooms smoothly into the gateway (scale 1.18 → 2.4 centred on the gate, 900 ms, ease-in), the glow fills the screen, and it fades into the world map, which arrives with its existing welcome. Total about 2.5 s, skippable by tapping.
5. Reduced motion: cross-fade to the open gate, then a plain fade to the map.

Later (optional): separate left and right door pictures would let the doors physically swing open. That needs 2 new assets; not required for this redesign. **(decide)**

## 7. Talk: a friendly voice room
Avoid: chat bubbles, a waveform bar, a "call" screen with red hang-up. Feelio's world, not a phone app.

```
 ┌───────────────────────────────────────────────┐
 │ [AI friend · not a person]               [door]│   ← disclosure chip, always
 │                                                │
 │              ( short caption bubble )          │   ← Feelio's current sentence (optional)
 │                                                │
 │          ◌ ◌  aura rings breathing  ◌ ◌        │
 │                ██  FEELIO  ██                  │   ← big, centred, the hero
 │                                                │
 │      [feeling card / breathing / place card]   │   ← cards slide up from below
 │                                                │
 │              (  🎤  big mic button  )          │   ← one control; an arc around it = time left
 │ [dock]                                         │
 └───────────────────────────────────────────────┘
```
- **Place:** the meadow scene, softly blurred and dimmed behind (the approved art, a CSS filter), so Feelio stands in its own world.
- **Feelio is the hero:** big and centred. Its pose follows the conversation:
  | State | When | Feelio | Aura | Words |
  |---|---|---|---|---|
  | Ready | before a talk | `mascot_waving` | slow, calm breath | "Tap the button and say hello!" |
  | Waking up | connecting | `mascot_thinking`* | the three companions bounce (existing loading beat) | "Waking Feelio up…" |
  | Listening | you speak | `mascot_listening` | rings **grow with your voice** (input level) | "I'm listening" |
  | Thinking | after you finish, before Feelio speaks | `mascot_thinking`* | rings slowly spin | "Hmm…" |
  | Speaking | Feelio talks | `mascot_speaking_*`* mouth frames by voice level (else a gentle bounce) | rings pulse with **Feelio's voice** (output level) | the caption |
  | Mood | from the tool | happy / excited / caring / calm poses | tinted aura (amber, rose, lilac, sky) | |
  \* until delivered, falls back to approved poses (already wired).
- **Aura rings:** two or three soft concentric circles in brand tints behind Feelio, scaled by voice level (CSS transforms, about 30 fps, GPU only). A functional voice indicator made of flat brand colours, not an illustration. **(decide: OK as code shapes?)**
- **One control.** A big round mic button: tap to start; while talking it shows a "stop" square. **Time left** is an arc around the button that slowly empties (amber in the last 30 seconds); no numbers to read.
- **Captions:** Feelio's current sentence in the say-bubble, large and short (helps readers, harmless for non-readers; can be turned off by parents later). The child's own words are **not** shown.
- **Cards** (feeling, breathing, place, help) slide up from the bottom over the meadow, art-first, with one close button; the help card always wins.
- **Graceful edges:**
  - *Microphone refused:* Feelio with `mascot_listening`, "I need the microphone to hear you. Ask a grown-up to help", and a "Try again" button; no error codes.
  - *Connection lost:* `mascot_confused`, "Oops, I lost you. Let's try again", one retry button; the session is ended on the server.
  - *Silence:* after 10 s of quiet a soft hint, "I'm here when you're ready"; ElevenLabs ends the call after 30 s (already configured) and the screen shows the goodbye.
  - *Time up / ended:* Feelio waves goodbye, "That was a lovely talk!", and the button becomes "Talk again later" (disabled while today's voice time is used up). Never a guilt line.
  - *Not available* (switched off, not approved, outside hours): a friendly resting screen like today, without a button that can't work.

## 8. Shared craft rules
- **Motion:** the `motion` library (already in the project) for springs and layout; CSS for loops. Only transforms and opacity (60 fps on low-end tablets). Every animation respects `prefers-reduced-motion`.
- **Sound:** existing UI sounds (pick, whoosh, unlock, pop); no new ones.
- **Touch:** every target ≥ 72 px; swipe and tap both work; nothing needs a long press except the grown-up door.
- **RTL:** carousels and walking direction flip in Arabic; the art is never mirrored.
- **No new illustration by code.** Everything visual is approved art; code adds only layout, flat brand shapes (balloons, rings, glow), transforms and fades.

## 9. Assets
**Needed for this redesign (already requested, prompts in ASSET_REQUESTS):** `mascot_thinking`, `mascot_speaking_closed/half/open`, the `ui_mic_object` redo. Everything else uses approved art.
**Optional:** separate gate doors (left and right) for a swinging-door version of the gate.

## 10. Build plan (after approval)
1. Sign text fix (all four places) + companion step removal (small, ships first).
2. The journey shell: camera walk, Feelio walking, stop transitions, progress stones, confirm pattern.
3. Character stage carousel; name balloons; interest carousel with pick slots.
4. Gate sequence.
5. Talk voice room (states, aura, arc timer, captions, edge cases).
6. Tests: update E2E for the new flow; screenshots in EN/AR, phone and tablet; reduced-motion pass; performance check (no layout thrash; CPU throttled 4×).
