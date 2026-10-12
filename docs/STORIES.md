# Stories: make a story with Feelio by voice (Milestone 6 plan, 2026-10-11)

Owner brief (2026-10-11): children create their own story by **talking with Feelio**, who guides them playfully (characters, place, adventure); the result is a **beautiful illustrated storybook** with real pages, page turns and optional narration by Feelio. Premium, on-brand, age-appropriate and emotionally supportive; voice first, no typing. List the assets that would help, but don't block on them.

Builds on: SPEC §5.2 (exactly 4 pages, beginning → development → resolution, a real feeling handled kindly, a reflection question), D-015 (animal or creature characters), D-024 (Feelio composited from approved poses, never generated), SR-19 (image prompts from templates and vetted fields only), D-0xx model notes (GLM-5.3-Flash for text, FLUX.2-dev for images, on Together).

## 1. The child's experience
```
 Stories (dock) ─► My bookshelf ──► [＋ Make a story with Feelio]
                        │                    │
                        │      Story workshop (voice, about 1–2 minutes)
                        │      Feelio asks 4 playful questions; picture choices appear as it asks
                        │      ("Who is our hero? A brave fox, a sleepy bear, a tiny dragon…")
                        │                    │
                        │      "Let's make it!" ─► the book is made (pages appear as they finish)
                        ▼                    ▼
                   Open a book ◄──────── The storybook: cover, 4 pages, "the end" + a question
                                         page turns, Feelio as narrator sticker, "Read it to me"
```

### 1.1 The story workshop (voice, guided)
- The same voice room as Talk (D-069), in **story mode**: Feelio wears its "making" look and the room shows the story being built as a row of **four picture slots**: Hero, Place, Feeling, Adventure.
- Feelio asks one simple question at a time, by voice. As it asks, **3–4 picture choices** pop up for that slot (from closed lists, e.g. heroes: fox, bear, bunny, owl, turtle, dragon, cat, penguin). The child can **say it or tap it** ("the fox!"), never type.
- When the child answers, the matching picture **flies into its slot** with a sparkle and Feelio reacts ("A brave little fox, I love it!"). Changing your mind is fine: say or tap another.
- Feelings come from the SPEC list (happy, sad, angry, worried, jealous, proud, lonely, excited…) with the brand feeling faces; Feelio asks gently ("How does our fox feel at the start?").
- When all four slots are filled, the big button becomes **"Make my story!"**. Tapping it (or saying yes) ends the voice part and starts the book.
- **Safety by design:** the voice model only fills the four slots through a tool with **closed lists** (`set_story_choice({slot, value})`). Free words from the child never reach the story writer or the image prompts (SR-19). Everything spoken still goes through the safety proxy as in Talk (crises handled the same way).

### 1.2 Making the book (progressive)
- A short magical wait with the approved art: Feelio painting (`mascot_making`), the companions bouncing, and the **pages appearing one by one** as each illustration finishes (cover first). The child can open the book as soon as page 1 is ready.
- Typical time: text about 3–5 s, then about 4–8 s per picture (measured during the build).

### 1.3 The storybook
- **A real book:** a two-page spread on tablets (picture on one side, words on the other), one page at a time on phones. Pages turn with a **3D page-curl-style flip** (CSS 3D transforms on the page halves; reduced motion: a cross-fade). Swipe, tap the page corner, or the big arrows.
- **Pages:** the generated illustration framed on a paper page, large readable text (Balsamiq Sans / the Arabic font), the page number as little stars.
- **Feelio as narrator:** a small approved pose in the corner of each page, matched to that page's feeling (D-024: Feelio is chosen by the text, never drawn by the model).
- **"Read it to me":** Feelio narrates the page in its voice, with the words highlighted as they are read (opt-in, SPEC §3.2). Audio is made once per story and reused; capped per child per day.
- **The end:** a gentle reflection question with picture answers ("How would you help the fox feel better?") and "Make another" / "Back to my shelf".
- **My bookshelf:** the child's stories as book covers on a shelf, newest first.

## 2. How it works (safety and cost)
| Step | What | Where |
|---|---|---|
| 1 | Voice workshop: the same agent and proxy as Talk, in **story mode** (session purpose `story`): a story-guide system prompt and one more client tool, `set_story_choice` (closed lists). Voice minutes count against the voice cap | `child/voice.ts`, `safety/voice-agent/` |
| 2 | Story request = the 4 vetted ids + age band + locale. Checked by T0 (trivially safe: ids only) | `safety/stories/` |
| 3 | Story text: GLM-5.3-Flash, `json_schema` = exactly 4 pages + title + reflection question + Feelio's mood per page + the hero's look (character sheet). Every page and the title pass the output check (strict). A misfit is regenerated once, then a reviewed fallback story | `safety/stories/` |
| 4 | Pictures: FLUX.2-dev. Prompt **assembled from templates** (style block from the brand + character sheet + page scene id), never from the child's words; character consistency through a first reference image. NSFW checker on; then our own vision check of each image; a block regenerates once, then a pre-approved fallback picture | `safety/images/` |
| 5 | Narration (opt-in): ElevenLabs TTS (Jessica) per page, made once, cached, capped per child per day; kill switch → text only | `safety/voice-lines/` pattern |
| 6 | Storage: story text (encrypted? no personal data), 4 images, optional audio; retention and deletion path documented | **decide** |

The SPEC "done when" applies: a review page shows 20 generated stories for your judgement (4 pages each, safe, consistent characters).

## 3. Assets that would make it premium (request list; nothing blocks)
Everything degrades gracefully: until an asset arrives, the screen uses approved art or a labelled grey box, as everywhere else.

**Story screens (most valuable first)**
1. `story_book_open`: an open hardcover storybook seen from the front, two blank cream pages, soft lilac cover edges (landscape 3:2, transparent). The book itself.
2. `story_page_paper`: a single blank storybook page with a soft deckled edge (portrait 2:3, transparent), for phones and page turns.
3. `story_shelf`: a cosy wooden bookshelf with two empty shelves (landscape, transparent), for My bookshelf.
4. `story_book_cover`: a blank closed hardcover book, front view, purple cover with a gold heart emblem, empty title area (portrait, transparent), for covers on the shelf.
5. `scene_story_corner_land` / `_port`: the story workshop place: a cosy reading nook in the meadow's style (opaque), the background of the workshop.
6. `ui_story_slot`: an empty round picture frame, like a gold-rimmed medallion (square, transparent), for the four choice slots.
7. `ui_magic_wand` or `ui_quill`: the "make my story" object (square, transparent).

**Choice pictures (closed lists, icon style like the like_ pictures)**
8. Heroes ×8: `hero_fox`, `hero_bear`, `hero_bunny`, `hero_owl`, `hero_turtle`, `hero_dragon`, `hero_cat`, `hero_penguin`.
9. Places ×6: `place_forest`, `place_beach`, `place_space`, `place_castle`, `place_garden`, `place_underwater`.
10. Adventures ×6: `adv_lost_toy`, `adv_new_friend`, `adv_big_race`, `adv_birthday`, `adv_storm`, `adv_first_day`.
11. Feelings: the brand has happy, sad, angry, excited faces; **worried, proud, lonely, jealous** faces in the same brand style would complete the SPEC list.

**Feelio poses for the narrator corner**
12. `mascot_reading` (holding an open book), `mascot_pointing` (have), `mascot_thinking` (requested), plus the feel_ poses (have).

The prompts go into `docs/ASSET_REQUESTS.md` (Batch 4) once you confirm the list.

## 4. Build order (nothing waits for art)
1. Story engine: closed lists, schema, text generation + output checks, fallback story; unit tests; the 20-story review page (text first).
2. Image pipeline: template prompt builder, FLUX.2 with reference image, NSFW + vision checks, fallback; model evaluation recorded in DECISIONS.
3. Storage and the bookshelf; retention and deletion.
4. The storybook reader (page turns, layouts, narrator Feelio, reduced motion).
5. The voice workshop (story mode in the agent and proxy, `set_story_choice`, the slot UI).
6. Narration (opt-in, cached, capped).
7. Tests (unit, integration, E2E), screenshots EN/AR phone/tablet, the review page with 20 stories.
