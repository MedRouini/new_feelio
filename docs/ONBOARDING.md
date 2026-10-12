# Onboarding: "Arriving in Feelio's world" (v1.2: redesigned as one continuous journey by D-069; see docs/REDESIGN_ONBOARDING_TALK.md, which supersedes the stop details below where they differ)

Two parts: a short **grown-up part** in the parent dashboard, then the **child's part** on the child's device, led by the mascot. Mostly voice and pictures; almost nothing to read.

## 1. Grown-up part (dashboard, adult area, plain and short)
Each step is one short page in the dashboard style, with the progress shown as "Step 2 of 4". This is the adult area, so a plain step indicator is fine.

| Step | What | Data stored | Status |
|---|---|---|---|
| 1. Consent (once per family) | The existing consent page | consent_record | Built (M1) |
| 2. About your child | Age group; the child's language; **optional** nickname typed by the parent (encrypted, never sent to AI) | child_profile | Built (M1); restyled to step form |
| 3. Settings | Talk on/off (with a note: voice is in adult testing until ElevenLabs approves under-18 use, D-005); Stories on/off; daily minutes (3 presets: 15/30/45); allowed hours (2 presets + custom); sound on/off | child_settings | **New UI** (the table already exists) |
| 4. Hand the device over | "Give this tablet to {name}". The existing device hand-off (D-033), which signs the parent out on that device | device key | Built (M1) |

Re-run any time: the child's page in the dashboard has "Change settings" and "Set up another device".

## 2. Child's part: the flow (one continuous scene, about 3 minutes)
The child's part happens in **one place: the welcome meadow**. It's a scene in the map's art style with a short path leading to a garden gate; behind the gate is the map. Each step is a stop along that path, and the mascot walks with the child. Choices appear as **objects standing in the meadow**. No forms, no cards.

```
 landscape tablet                                       portrait phone
 ┌──────────────────────────────────────────────┐      ┌────────────────────┐
 │  sky (lilac)                    [door] ◄ grown-up   │ sky          [door]│
 │                 ( say-bubble: "Hi! I'm Feelio" )  │      │ ( say-bubble )     │
 │   MASCOT                choices stand here     ║   │      │                    │
 │   (big, left in LTR,    on the meadow:         ║   │      │      MASCOT        │
 │    right in RTL)        ◯   ◯   ◯              gate │      │                    │
 │ ~~~~~~~~ meadow ground ~~~~~~~ path ~~~~~~~~~~~║   │      │  ◯   ◯   ◯  choices│
 │ [skip]                                              │      │ ~~~~ meadow ~~~~~~ │
 └──────────────────────────────────────────────┘      │ [skip]   gate ↑    │
                                                       └────────────────────┘
```

- **Layout rule:** mascot at the start side (left in English, right in Arabic), choices in the middle, gate at the end side. In Arabic the **layout** flips, so the journey reads right to left. The **art is never mirrored**: the meadow background is delivered once per orientation, without text, and the mascot keeps its own image.
- **One action per stop:** tap a choice. The mascot reacts, then walks forward on its own. A "replay" tap on the bubble repeats the voice.
- **Skip:** a small, quiet "skip" in the bottom corner (functional icon). Skipping uses sensible defaults (avatar 1, companion star, list nickname, no interests), and everything can be changed later from My collection.
- **Resume:** every finished stop is saved on the server (`onboarding.step`). Coming back resumes at the next stop. Already finished? The child goes straight to the map.

### Stop 1: Hello, I'm an AI friend (disclosure, audible and visible)
- **Idea:** Feelio waves from the meadow. The words **"I'm Feelio, a friendly AI"** are on a **wooden name sign** next to it, and Feelio says them.
- **Voice line (EN):** "Hi! I'm Feelio. I'm a friendly AI. That means I'm not a person, I'm a computer friend who loves talking about feelings."
- **Interaction:** tap Feelio (or wait) → "Shall we make you a character?" The mascot points at the meadow.
- **Assets:** `scene_meadow_land`, `scene_meadow_port`, `ui_sign_plate`, `ui_say_bubble`, `mascot_waving`, `mascot_pointing`.

### Stop 2: Make your character
> **Updated 2026-10-10 (D-053):** one character (`bun`) for now. The child picks its colour by tapping the character in each of the 4 colours (no shape choice, no paint pots), then a companion and a name. Its "yay" is a code hop (no cheer pose).

- **Idea:** three little **creature friends** stand on stepping stones (not people: D-015 safety choice and no human likeness). Tap one and it hops.
- **Colour:** four big **paint pots** (flat brand colour circles in code are allowed, but a delivered paint-pot object reads better: `ui_paint_pot`, recoloured by an approved variant, not by code). Tap a pot and the chosen creature changes colour with a little splash bounce.
- **Companion:** heart, cloud or star floats down beside it (existing brand companion art).
- **Nickname:**
  - Feelio offers names **by voice and picture**: the parent's nickname if one was set, plus 6 friendly names from a reviewed list per language.
  - Tap one; Feelio says it. The chosen name appears on a small name sign held by the character.
  - **No typing for ages 5–9.** Ages 10–12 may type their own name only after the safety layer exists (Milestone 2). Until then, list only.
- **Assets:** avatar set (§5), `ui_paint_pot` ×4, existing companions, `ui_sign_plate`.

### Stop 3: What do you like?
- **Idea:** eight **picture signposts** stand along the path (animals, space, music, drawing, ball games, plants and nature, building blocks, the sea). Tap up to three, and each one glows and hops. No text needed, and Feelio names each one aloud when tapped.
- **Used for:** the greeting ("Hi Pip! Want to hear about space today?") and story suggestions only. Stored as fixed ids, so nothing sensitive is collected.
- **Assets:** `like_animals`, `like_space`, `like_music`, `like_drawing`, `like_ballgames`, `like_nature`, `like_blocks`, `like_sea`.

### Stop 4: Can I hear you? (microphone moment)
- **Shown only if** the parent turned Talk on. Otherwise Feelio says "Your grown-up can turn on talking later" and walks on.
- **Idea:** Feelio cups its ear (`mascot_listening`) and asks the child to tap a big **friendly microphone** object. The browser asks permission (the parent's consent was captured in step 1; the browser prompt still appears, by design).
- **Test that sends nothing anywhere:** after permission, the child says "hello" and **Feelio's ears wiggle** in time with the sound. The volume is read **locally on the device** and no audio is sent to any server (no ElevenLabs, no transcript).
- **Voice line:** "When you want to talk, tap my microphone. I only listen after you tap. A grown-up can turn this off."
- **If the child says no:** Feelio says "That's okay! We can still play" and walks on. Never pressure.
- **Assets:** `mascot_listening` (already requested, P3 in Batch 1), `ui_mic_object`.

### Stop 5: Into the world (first map moment)
- **Idea:**
  1. The gate swings open (a two-frame swap between `ui_gate_closed` and `ui_gate_open`).
  2. Cut to the map: Feelio and the child's character walk onto the first stone (Home). The character hops on its own path; Feelio walks with the delivered walking poses.
  3. The Home stone lights up: "This is your world. Your first place is Home!"
  4. Onboarding is marked complete.
- **Assets:** `ui_gate_closed`, `ui_gate_open`, map assets (approved), the avatar set.

## 3. Captions, audio and languages
- Every mascot line is **pre-generated static audio** in EN and AR, reviewed, and shown as a caption at the same time (CR-11: fixed phrases are static). About 30 lines × 2 languages ≈ 4,000 characters ≈ 2–4k ElevenLabs credits.
- **Blocker:** ElevenLabs' under-18 policy (D-005) probably also covers static audio played to children. Options for Q-O1:
  - (a) ask ElevenLabs for approval now and generate after the yes
  - (b) record the lines in a human voice yourself (free; you'd need to be happy to be "Feelio's voice")
  - (c) the browser's built-in speech for the pilot (free, on-device, quality and Arabic voices vary by device)

  Until decided, captions plus the mascot's motion carry the meaning, so nothing is fake and nothing is blocked.
- Arabic: separate reviewed lines (not machine-only translations; native review before the pilot), and RTL layout composed on purpose (§2 layout rule).

## 4. Safety and privacy (CLAUDE.md, SAFETY_POLICY)
- **Nothing the child types or says reaches any model in onboarding:**
  - names come from a reviewed list
  - typing is off until M2, and when on it goes through `safety/` (PII and abuse check) before saving
  - the microphone test is local only
- **The AI disclosure** is in Feelio's first words at stop 1, heard and shown; afterwards one quiet line on Talk and on the story workshop (SR-20, D-071).
- **Data stored** (all child-scope, deleted with the profile, visible to the parent):
  - `avatar` {shape, colour, companion}
  - `nickname` (either a list key, which is not personal, or the parent's encrypted nickname)
  - `interests` (fixed ids, at most 3)
  - `onboarding` {step, completedAt, skipped}
  - Nothing else. No photos, no voice, no free text from the child before M2.
- **The child cannot reach parent settings:** the grown-up door leads to the dashboard sign-in and gate (D-033, D-036).

## 5. The avatar: data model and composition (used on the map, Talk, stories, collection)
- **What it is:** a small Feelio-world **creature**, not a person and not a second mascot. It has **no antenna, no screen face and no belly heart**: those mark the AI mascot, and the child's character must never look like an AI.
- **Choices (D-053):** one shape (`bun`) × 4 colours × 1 companion choice, out of 3 (heart, cloud, star). The data model keeps `shape` so more characters can return later without a migration. Accessories: none.

```ts
type Avatar = {
  v: 1;
  shape: "bun" | "bean" | "puff";               // round / tall / fluffy
  colour: "amber" | "rose" | "lilac" | "sky";   // brand colours
  companion: "heart" | "cloud" | "star";        // existing brand companions
  accessory?: null;                              // reserved, not in v1
};
// child_profile.avatar jsonb, validated by zod; default { v:1, shape:"bun", colour:"amber", companion:"star" }
```

- **Composition (no drawn code):**
  - `Avatar` renders the delivered image `avatar_{shape}_{colour}_{pose}` and places the delivered companion image beside it.
  - Poses: `idle` and `cheer`. Walking on the map is a **hop** (a code transform on `idle`), so no walking poses are needed.
  - The avatar may be flipped horizontally for direction. It isn't the mascot (whose never-mirror rule stands), and the creature designs are symmetric, which the prompts require.
  - Total avatar images: **4** (`bun` in amber, rose, lilac, sky). The cheer is a code hop.
- **Where it appears:**

| Place | How |
|---|---|
| Map | Next to the mascot marker |
| Talk | Small, at the child's side of the scene |
| Stories | Composited as a character, like Feelio (D-024) |
| My collection | Large, with its companion and collected moments |

## 6. Data model changes (Milestone 1b+)
- Add to `child_profile`: `avatar jsonb`, `nickname_key text` (list key; null when the parent nickname is used), `interests text[]` (enum ids, ≤ 3), `onboarding jsonb`.
- Migration: additive only (no destructive change).
- Retention: lifetime of the profile. Deleted with the profile. The parent can view and change all of it.
- Nickname list: `content/nicknames.{en,ar}.json`, reviewed (friendly, neutral, not real-person names, no religious terms).

## 7. Tests (built with the onboarding)
- **E2E:** complete onboarding in **EN and AR × landscape tablet and portrait phone** (4 runs). Each run checks:
  - the disclosure sign is visible and its audio element exists
  - every choice persists, resume works after a reload mid-flow, and skip works
  - the map shows the avatar, and Home is unlocked
- **Integration:** the child scope can only write its own onboarding fields, and only listed values (server-validated).
- **Visual review:** screenshots at the 3 sizes, critiqued against DESIGN_SYSTEM §2 before showing you.

## 8. Decisions needed (onboarding)
- **Q-O1 Voice for the fixed lines:** (a) ElevenLabs after approval, (b) your recorded voice, (c) browser speech for the pilot.
- **Q-O2 Avatar concept:** creatures (not people), 3 shapes × 4 colours, companion choice. Approve?
- **Q-O3 Interests list:** the 8 pictures above. Change any?
- **Q-O4 The order with the map:** I'd build this onboarding **as part of Milestone 1b**, since stop 5 is the first map moment, and finish the map with the avatar on it. Agree?
