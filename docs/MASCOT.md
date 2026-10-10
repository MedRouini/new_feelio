# The mascot as the heart of the product (Duolingo-style guide, kinder rules)

The mascot is the product's face and guide, present on almost every child screen, and the voice companion's body. Children should feel they are talking to a character, not using a form.

## Role by screen
| Screen | What the mascot does |
|---|---|
| Onboarding | Introduces itself in child words, including that it is an AI friend and not a person |
| Map | Marker on the current place; hops along the path to the next place; reacts to taps (excited), to locked places (gentle "not yet") |
| Talk (voice) | Full-screen hero, like a video call: big mascot in the centre, states for listening, thinking, speaking, with a big microphone control |
| Stories | Narrator at the start and end; small sticker on page corners where the design wants it |
| Scenarios | Reacts to the child's choice with empathy (not right/wrong judging); asks the reflection question |
| Collection | Shows collected moments and companions (heart, cloud, star) |
| Loading and errors | Playful waiting, sleeping when offline, confused with a retry when something fails |
| Time limit | Waves goodbye, sleepy and warm; never pleads or guilt-trips |
| Parent area | Minimal or absent; this area is for adults |

## Rules of behaviour (differences from Duolingo on purpose)
- Warm, never pushy: **no guilt notifications, no streak pressure, no "I'm sad you left" lines, no manipulation to stay longer.**
- Always an AI friend: visible chip "I'm Feelio, a friendly AI" in child words, with audio, on the Talk screen and at onboarding.
- Points back to trusted adults; never presents itself as the child's only friend.
- Reactions follow the child's feeling: empathy first, celebration only for effort and kindness, not for scores.

## State machine (code)
States: `idle`, `listening`, `thinking`, `speaking`, `happy`, `excited`, `empathy` (sad/caring), `calm`, `proud`, `celebrating`, `confused`, `sleeping`, `waving`, `walking_left`, `walking_right`, `pointing`.
- **Idle motion** (breathing, blink, antenna bob) is done in code with transforms on the delivered images.
- **Voice states** come from the ElevenLabs session mode events (listening, speaking). The agent may also set an emotion through a client tool (`set_mascot_state`, limited to the allowed list) so the mascot reacts to the content. Verify the client-tool and output-volume APIs in the current docs.
- **Speaking mouth:** if delivered, three mouth frames of the speaking pose (closed, half, open) are swapped by output audio level. If not delivered, use one speaking pose with a gentle bounce.
- **Crisis moments:** the mascot shows `calm` or `empathy`, never `excited`, while the reviewed script plays and resources show.
- Respect `prefers-reduced-motion`: swap poses without bouncing or travelling.

## Pose library to request (all transparent PNG, 1024×1024 minimum, full body unless noted)
Use the standard mascot prompt below for each. Request in this priority order and in batches, using the official mascot as the reference, plus the first approved pose as a second reference after the first one is accepted.

**Batch A (needed for the map and voice):** `mascot_idle`, `mascot_idle_blink`, `mascot_listening`, `mascot_thinking`, `mascot_speaking_closed`, `mascot_speaking_half`, `mascot_speaking_open`, `mascot_happy`, `mascot_excited`, `mascot_walking_left`, `mascot_walking_right`, `mascot_waving`.
**Batch B (emotions and reactions):** `mascot_empathy`, `mascot_calm`, `mascot_proud`, `mascot_celebrating`, `mascot_confused`, `mascot_sleeping`, `mascot_pointing`, `mascot_scared`, `mascot_surprised`, `mascot_jealous`, `mascot_lonely`.
**Batch C (small and special):** head-only avatar for the dock and buttons (`mascot_head_*`), map marker with a ground shadow (`mascot_marker`), the heart, cloud and star companions in 3 expressions each, a thumbs-up, a "shh" for quiet moments.

### Standard mascot prompt (paste into ChatGPT with the official mascot attached)
> Create an image. I attached the official mascot. Keep this exact character: same design, proportions, colours, glossy kawaii vector style, antenna with amber orb, dark blue screen face with sparkle eyes, pink cheeks, heart on the belly, stubby arms and feet. Change only the pose and expression: [POSE: e.g. waving with the right arm, leaning slightly forward] and [FACE: e.g. happy eyes and open smile on the screen face]. Full body, centred, transparent background PNG (plain white if transparency fails), 1024×1024, no ground shadow, no props, no text, no letters, no other characters.

For mouth frames add: "Same pose and body as the attached pose image, only the mouth changes: [closed / half open / wide open]."

## Acceptance
Each pose must look like the same character as the original and the other poses. If the screen face drifts, request the pose again, or request the body only and let the owner paste the official face template onto it.
