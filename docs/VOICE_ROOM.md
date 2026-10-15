# Voice room: Feelio's nook, with activities (D-076)

The redesign of the Talk page (owner brief, 2026-10-14). The page was already a working voice room (D-068, D-069). This change makes Feelio an *actionable* companion: Feelio can offer a calm activity or a story, and the child starts it with one tap.

## What the child sees

### The nook
- **Scene:** the approved talk-nook art. Feelio stands in the middle, big, in the lamp light.
- **Main control:** the approved microphone object (`ui_mic_object`), not a round conferencing button. Its plate says what a tap does: "Talk to Feelio", "Stop talking", "Try again" or "Talk again".
  - **While Feelio listens:** a warm light behind it glows with the child's voice.
  - **Time left:** an arc around it, with no numbers.
- **The AI notice** stays as one quiet line at the top.

### How Feelio shows each state
Feelio itself shows the state, not text:

| State | What Feelio does |
|---|---|
| Idle | Waves |
| Connecting or thinking | Thinking pose, with the three brand companions bouncing |
| Listening | Listening pose; the companions drift in |
| Speaking | Mouth frames follow its voice; the companions rise |
| Lost or a problem | Confused pose, with a kind line |

Only one phase shows at a time (`roomPhase`):
- an activity outranks the call
- a problem outranks the voice state

### Pictures beside Feelio
- **A feeling** (`show_feeling_card`) appears as the brand's feeling face at Feelio's left, with its word. There is no card, and it fades after 12 s.
- **An offer** (`offer_activity` or `suggest_place`) stands at Feelio's right as a glowing object with a plate ("Breathe with me", "Noticing game", "Stretch with me", "Make a story", "Go to the Park"). Feelio switches to its pointing pose.
  - The offer's side is physical, not mirrored for Arabic, because the mascot never mirrors.
  - "Not now" puts the offer away.
  - Nothing starts until the child taps it.

### Help (the crisis tool)
The crisis tool is emitted by the router, never the model. Help is the one panel in the room:
- It sits over everything and takes focus.
- It stays until the child closes it.
- It clears an offer, and nothing else can appear while it is open.

## Activities
> **Changed 2026-10-16 (owner):** during a live talk, the child's spoken yes starts the game by itself and the call stays open (microphone muted while playing), then the same conversation goes on. The tap-to-start and close-the-call text below describes the no-call case. See D-076.

- **Starting one:** tapping a calm offer ends the live call. While the activity runs, it spends no voice minutes or credits.
- **Who keeps time:** the app owns the rhythm.
  - Each step has a fixed length, or waits for the child.
  - The animation follows the step.
  - Feelio's pre-recorded line for the step plays as the step starts. Pausing stops both the animation and the voice, so they can never drift apart.
- **Controls, always available:**
  - Stop (or the Escape key)
  - Pause / Keep going
  - Next
  - At the end: Again, Talk to Feelio, or Back to Feelio

| Activity | Steps | Picture |
|---|---|---|
| Breathing | intro, then 3 × (in 4 s, out 5 s), then the end. **No breath-holding, ever.** | The cloud grows as the child breathes in and softens as they breathe out (driven by the step's real progress every frame). The seconds light up one by one. Feelio breathes along. Pips count the breaths |
| Noticing (grounding 3-2-1) | Find 3 things to see (stars), listen for 2 sounds (hearts), feel 1 thing (a cloud) | The child taps a picture for each thing found. Feelio looks, listens, hugs. It goes at the child's pace, with no timer |
| Stretching | Reach up, sway, shake your hands, hug yourself (6–8 s each) | Feelio demonstrates each move gently. A ribbon fills with the time. The intro says the child can stand up or stay sitting, and Next skips any move |

- **After an activity,** "Talk to Feelio" starts a new talk. The app tells our proxy which activity the child just finished, as an id from a closed list. Feelio then gently asks once how they feel now.
- **A story or a place** is a door: the offer links to the story theatre or the place, and leaving the page ends the talk.

## How the agent connects (verified in code and tests; live only after the sync)
- **The tool:** `offer_activity({activity: breathing | grounding | stretching | story})` replaces `start_breathing`.
  - The arguments come from a closed list.
  - It is validated in the proxy and again in the browser.
  - It runs only after every sentence of the turn was released.
- **Permission (server side):** a story is offered only when story making is open for this child now (`storyGate`, in `proxyTurn` as `storiesOpen`). A place is offered only when the child has reached it. Both use `allowedForChild`.
- **What Feelio is told (`sys-v0.6`):**
  - Offer in words first, then call the tool only after the child says yes.
  - No is fine; never push.
  - Pick an activity to match the feeling: overwhelmed → breathing, worried → grounding, restless → stretching, creative → story (stories only when open).
  - Feelio is a friendly helper, not a therapist: never diagnose, never promise a fix, and point big or recurring feelings to a trusted grown-up.
  - Crisis handling is unchanged: the router, then help.
- **Stale and doubled calls:**
  - The same offer twice changes nothing.
  - Tools that arrive while an activity runs are ignored (except help).
  - The browser double-checks what this child can open.

## Tasks
- [x] Inspect the Talk page, voice hook, proxy, tools, prompts, session gate, assets and tests
- [x] Decide the interaction model (offer → tap → activity with pre-recorded guidance; the talk closes)
- [x] `offer_activity` tool, permission filter, `storiesOpen` from the server, after-activity context, prompt `sys-v0.4` (unit and integration tests)
- [x] Pure activity lifecycle and room rules (`child/activities.ts`, `child/talkRoom.ts`; 15 unit tests)
- [x] Talk room redesign: mic object, in-scene feeling and offer, help panel, one phase at a time
- [x] Activity stage: breathing, noticing, stretching; pause, next, again, stop, Escape; focus moves in and out
- [x] 14 English voice lines (talk hint and every step), generated with the existing script (about 590 credits)
- [x] Arabic and English strings (Arabic plays captions only until an Arabic voice exists, D-064)
- [x] Batch 8 art requests (7 mascot poses, 3 start objects) with approved stand-ins until delivered
- [x] End-to-end test written (`tests/e2e/m9-voice-room.spec.ts`)
- [x] Run the end-to-end tests and review the screenshots (12/12 with m5, 2026-10-14; fixed: phone layout, Feelio size on tablet, offer swap, focus on arrival)
- [ ] Owner: re-run the agent sync with a live tunnel, so the agent knows `offer_activity`
- [ ] Owner: a spoken test on a real device (offer → yes → activity → talk again)
- [x] Batch 8 generated (Codex) and approved, 2026-10-15: all 10 wired through their slots

## Not built (on purpose)
- **Ambient sounds in the noticing game:** no approved audio exists, and sounds are not part of the image pipeline.
- **The Calm dock page** stays "coming soon" (D-055). The activities are built so it could reuse them later.
- **Live voice guidance during an activity:** it is turn-based, so it can't keep a rhythm. It would also spend credits and hit the agent's 30-second silence timeout.
