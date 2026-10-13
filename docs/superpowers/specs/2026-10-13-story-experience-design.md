# Story experience: design spec

Date: 2026-10-13. Status: design approved in conversation. Waiting for the owner's review of this written spec. Decision record to add on implementation: D-075.
It builds on D-070 (stories) and D-071 (the theatre, the library and the captions).

## 1. Purpose and agreed understanding

**Owner's brief (2026-10-13):** a complete UI and UX refactor of the story pages: the library, `/make` and the storybook.
- **Look and feel:** engaging, intuitive, visually appealing and fun for children; a high-quality children's storytelling game, not a dashboard.
- **Structure:** rethink layouts, navigation, buttons and interactions, keeping all functionality, the data flows and the brand.
- **Theatre:** keep it as the foundation of `/make`, but replace the unattractive hero, place, feeling and adventure selection.
- **Buttons:** build a creative, consistent system, not pills, bubbles, shadows or generic cards.
- **Input:** touch first, and it must also work with a mouse and a keyboard.
- **Assets:** for anything new, write generation prompts instead of improvising visuals.

**Owner decisions:**
- **Scope:** the library (`/stories`), the storybook (`/stories/<id>`) and the theatre (`/make`).
- **Buttons are hybrid:**
  - the few big actions are illustrated action objects (new art)
  - everyday controls share one "pressable" style in code
  - selections are the pictures themselves
- **Picking in the theatre:** a swipe carousel. Tapping the picture in the middle picks it; tapping a side picture brings it to the middle.
- **The whole design was approved,** including the step tickets, the curtain rope, the library object and the storybook changes.

**Problems found in the current pages:**
- choosing takes two steps (swipe, then "Choose this")
- every action is the same pill
- the stage shows words, not the chosen pictures, so children who can't read see nothing
- there is no sense of steps
- the carousel arrows and dots are generic
- the library's main action is a plain pill

**Success:**
- A 5-year-old makes a story alone, by touch, without reading.
- They can always see where they are, what they chose, what's next and how to go back.
- One consistent button language across the three pages.
- No overlaps at 1180×820, 1920×920 and 390×844 in English and Arabic.
- Works with touch, mouse and keyboard.
- Reduced motion is respected.

## 2. The interaction system (shared)

New components live in `child/ui/`, one per file, and are reused by all three pages.

### 2.1 Action object (`ActionObject`)
The few big actions:
- make a new story (library, end of book)
- pull the curtain rope to make the story (theatre)
- read it to me (storybook)
- tell Feelio (theatre, which uses the approved `ui_mic_object`)

**Structure:**
- An illustrated object (an `AssetImage` id) with a short label on a small plate beneath. The whole object is one `<button>`, or a link when it navigates.
- At least 96 px for the object, and the target is at least 72 px all round.

**States:**
- **Idle:** a gentle breathing scale. Static when calm.
- **Pressed:** squash to 0.92, then a spring back, with a sound.
- **Ready (attention):** the object glows (an amber halo using an opacity animation). Used for the curtain rope once all four are chosen.
- **Loading:** a slow wobble, the label changes (for example "Writing your story…"), and `aria-busy`.
- **Done:** a one-off sparkle burst.
- **Resting:** used when the action isn't possible now (the daily cap, or outside hours handled by the server). The object rests with a small moon badge, and Feelio's caption says why. It's never shown as a broken or red button, and it stays focusable, with its label explaining why.

**Rules:** it's built on the existing `ThingButton` behaviour (the pop and the sound), extended with these states.

### 2.2 Pressable (`Pressable`)
Everyday controls: back, previous and next page, the carousel arrows, the step tickets and secondary actions.

**Shape:**
- A chunky rounded square (`border-radius: 22px`), not a pill.
- It sits on a solid base layer 6 px deep, a darker shade of its colour. The base is a second element or `::before`, never a shadow.
- **Round variant** (`shape="round"`) for icon-only controls.
- **Wide variant** for a labelled control, with an icon plus a word.

**States:**
- **Pressed:** the face sinks into the base (`translate: 0 6px`) on `:active` and on `pointerdown`, and comes back with a spring.
- **Focus-visible:** a 4 px navy outline offset by 4 px.
- **Disabled:** lowered (sunk), faded to 50%, and `aria-disabled`. It stays focusable only where a reason is announced.
- **Selected** (`aria-pressed` or `aria-current`): an amber face.
- **Loading:** three dots pulse inside.

**Tones:** `primary` (amber face, navy text), `plain` (white face, purple text) and `night` (purple face, white text, for dark scenes).

### 2.3 Selection disc (`ChoiceDisc`)
- A picture on a round stage-light disc: a radial gradient of light. That's a flat brand-colour gradient, not blur and not a shadow.
- **Selected:** an amber ring 5 px wide, a check badge (a lucide Check on an amber circle), and a small bob (static when calm).
- **Unselected:** a soft lilac ring.
- **Without art:** the choice's word on the disc, never a grey box.

### 2.4 Rules for all of them
- Nothing relies on hover; hover only adds a lift where it's supported (`@media (hover: hover)`).
- `touch-action: manipulation` (no double-tap zoom).
- Feedback within 100 ms of `pointerdown`.
- Targets of at least 72 px, with at least 12 px between them.
- Every control has an accessible name (the visible label or `aria-label`) and a visible focus ring.
- Only `transform` and `opacity` animate, and every motion has a fade or static version under `useCalm()`.

## 3. `/make`: the theatre

**Layout (landscape):**
- **Top:** the AI line (D-071, unchanged) and Feelio's "title" caption.
- **Below them:** the **step tickets**, four `Pressable` tickets in a row (hero, place, feeling, adventure). Each one shows:
  - when done: the chosen picture, a small check and the word
  - when current: the step icon (`ui_step_hero`, `ui_step_place`, `face_happy`, `ui_step_adventure`), lit amber with `aria-current="step"`
  - when not yet: the step icon on a plain ticket
  
  Tapping a ticket opens that step. A ticket shape cut with CSS `clip-path` (notched sides) is a shape, not an illustration.
- **Centre:** the **stage**, larger than today. It shows **pictures**:
  - the hero's art large in the spotlight
  - the place's art as a big painted set piece behind, with the place colour gradient (D-071) as the stage floor and wall
  - the feeling's colour on the lights, plus its face on a small lamp at the top
  - the adventure's art as a prop at stage right
  
  Empty parts show their step icon softly. Tapping a part on the stage opens that step too. The curtains (D-071) close while the story is written. Feelio the director stands at the stage's side.
- **Front of the stage:** the **carousel**, a row of `ChoiceDisc`s. The middle one is larger and lit; 2 or 3 show on each side, getting smaller and fainter.
  - **Swipe or drag** moves it (pointer events, so touch and mouse behave the same).
  - The **arrow `Pressable`s** (round) sit at both ends, mirrored in Arabic.
  - The **keyboard** ←/→ moves it, and Enter or Space picks.
  - **Tapping a side disc** brings it to the middle. **Tapping the middle disc picks it.**
  - The middle disc has a small "tap to choose" hint: a pulsing hand-free ring, and the label "Choose" on a pressable plate beneath. Tapping the plate also picks.
- **Picking:**
  - The picked disc's picture flies onto the stage (motion `layoutId` between the disc and the stage part; a fade when calm).
  - Its ticket fills with a sparkle, Feelio says "Nice! … Now…", and the next empty step opens.
  - The server call is unchanged (`POST /api/child/stories {action:"slot"}`). If it's refused, the existing refused lines play and nothing moves.
- **Actions** (bottom right):
  - The **curtain rope** (`ActionObject`, `ui_btn_curtain_rope`) appears once all four are chosen, with the ready glow. Pulling it makes the story: the loading state, the curtains close, and it navigates as today.
  - **Tell Feelio** (`ActionObject`, `ui_mic_object`) shows when Talk is allowed, at the bottom left. While live it shows a "listening" ring and a stop label.
- **Portrait (phone):** the tickets in one row at the top (small, the picture only), then the stage, then the carousel, then the actions in one row.

**States to cover:**
- **Loading the page:** the server-rendered draft, so no client loading.
- **Making:** the rope is loading, the curtains close, and the loading beat (existing) plays.
- **Refused:** a choice or making refused because of the daily cap, Stories off, unavailable, time up or outside hours. Feelio's caption line plays (existing keys), nothing breaks, and the rope rests.
- **Voice not allowed:** no mic object.
- **Calm:** no fly, bob or pulse; fades only.

## 4. `/stories`: the library

**Layout (landscape):**
- **Background:** the library scene (approved). The caption is at the top.
- **Start side:** the **reading table**, with the "make a new story" `ActionObject` (`ui_btn_make_story`) large on it, and Feelio reading beside it.
- **End side:** **My books**, on wooden shelves (D-071 planks). Each book is a cover tile (its own picture, or the brand cover with the heart companion).
  - **New books:** a glowing ribbon instead of the "New" pill.
  - **Tapping a book:** it slides forward and scales (a shared layout into the reader's cover; a fade when calm), then opens.
  - **Navigation:** books are links (`<a>`), focusable, with the title as the name.
- **No books yet:** the shelves are empty, Feelio points at the make object, and the caption says "Let's make your first story!"
- **Daily cap reached:** the make object is resting (moon badge), and the caption says the existing cap line. Books still open.
- **Stories off:** unchanged (the page isn't reachable; D-070).

**Portrait:** the make object and Feelio at the top, then the shelves in a scrollable grid of 2 columns.

## 5. `/stories/<id>`: the storybook

- **Keep:** the two-page spread on wide screens, the 3D page turn, the single page on phones, cover → 4 pages → the end, and the narration rules.
- **Turning pages:** the side arrows become **page-corner `Pressable`s** (round, `plain` tone) on the book's outer edges, mirrored in Arabic. Swipe still turns, and ←/→ on the keyboard turns.
- **Back to the library:** a round `Pressable` (home icon) at the top start.
- **"Read it to me":** an `ActionObject` (`ui_btn_read_aloud`) beside the book.
  - **While playing:** the "listening" ring, with the label "Stop".
  - **Arabic stories:** hidden, as today.
  - **Daily narration cap reached:** resting, with Feelio's line.
- **Progress:** bookmark tabs on the book's top edge, one per page. The current one sticks out further. Tapping a tab jumps to that page.
- **Cover:** the "Open the book" pill becomes a `Pressable` (wide, `primary`), with the open-book icon and the label "Open".
- **End page:** the reflection question's answers as `ChoiceDisc`s (word discs, since there's no art for answers), plus the "make another story" `ActionObject` and a "back to my books" `Pressable`.

## 6. Art: Batch 7

Six pieces, made with Codex from `assets/requests/batch7/jobs.json` into `assets/incoming/batch7/`, then reviewed and approved:
- `ui_btn_make_story`
- `ui_btn_curtain_rope`
- `ui_btn_read_aloud`
- `ui_step_hero`
- `ui_step_place`
- `ui_step_adventure`

Until they're approved, the grey `TODO(PLACEHOLDER)` box of the right shape shows (rule 10). The feeling step uses the approved `face_happy`, and Tell Feelio uses the approved `ui_mic_object`.

## 7. Data, safety, i18n

- **No change** to data, the routes, the safety checks, the caps or the voice. The UI only.
- **Strings:** new strings in `messages/en.json` and `messages/ar.json` under `child.stories` (for example `steps.*`, `chooseHint`, `open`, `readAloud`, `stop`, `myBooks`, `firstStory`, `writing`). Arabic is written for real, not machine-copied.
- **Mirroring:** mirrored controls use logical properties. Art and the stage pictures are never mirrored.
- **Audio:** fixed new lines get pre-generated audio when they're fixed phrases (D-037); lines with a name or a choice stay captions.

## 8. Testing

- **Unit:**
  - the carousel's index logic (wrap, clamp, tap-a-side-to-centre, keyboard)
  - each `Pressable` and `ActionObject` state maps to its attributes (pure helpers)
- **E2E (Playwright):**
  - **Touch:** a `hasTouch: true, isMobile: true` context with `tap()`. Make a story end to end: tickets, swipe the carousel by dragging, tap the middle to pick, change a step via its ticket, the rope appears, and creation is stubbed as today (the existing tests make no credit-spending calls).
  - **Mouse:** the same flow with clicks and arrow buttons.
  - **Keyboard:** Tab to the carousel, ←/→, Enter picks, Tab to a ticket and Enter.
  - **Library:** no books, books, new ribbon, opening a book, the cap resting state.
  - **Storybook:** page-corner buttons, swipe, bookmark tabs, keyboard, the end page.
  - **Reduced motion** emulated for one run of each.
  - **Layout:** no overlaps at 3 sizes × 2 languages on all three pages.
- **Screenshots** reviewed before every commit.

## 9. Out of scope

- New choices or new story content.
- Changes to story generation or pictures.
- A new theatre scene.
- Sound design beyond the existing sound roles.
- Typed input.
- A parent view.
