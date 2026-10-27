# My room: design spec

Date: 2026-10-13. Status: approved in conversation (all four sections), waiting for the owner's review of this written spec.
Replaces the treasure-room collection (D-071). Decision record to add on implementation: D-074.

## 1. Purpose and agreed understanding

**Owner's request (2026-10-13):** the collection page's layout doesn't make sense, and putting achievements, stories and feelings inside a book doesn't make sense either. Kids need a better layout, an engaging experience, and the ability to customize their character and name. **Most important: it must feel fluid, and the layout must be perfect.**

**Owner decisions:**
- The page becomes **My room**: the child's own bedroom, with their character in the middle and what they earn appearing as objects in the room.
- **Dress-up with unlocks:** wearable items that the child unlocks.
- **Everything counts toward unlocks:** stories made, feelings met, and (from Milestone 4) finished levels move a gentle progress bar. Every few steps an item unlocks.
- **Name:** changed any time by picking again from the reviewed list, or the parent's nickname. Nothing is typed.
- **Parents** don't see the room or the character in the dashboard.
- **Items are layered pictures** placed on the character, not pre-drawn outfits.

**Assumptions (not contradicted by the owner):** the 4 existing colours stay changeable; likes (up to 3) can be changed in the room; no streaks, daily rewards or loss timers (CLAUDE.md rule 12).

**Success:**
- A 5-year-old can find the wardrobe, put on a hat and change their name without reading.
- Every move animates smoothly, at 60 fps on a mid-range tablet.
- No overlaps or clipped text in landscape (1180×820, 1920×920) or portrait (390×844), in English and Arabic.

## 2. The room (section 1)

**Scene:** `scene_my_room_land` and `scene_my_room_port` (new art). Until both are approved, the approved `scene_treasure_room_*` stands in. Never flat colours, never blur.

**Centre stage:**
- The child's **character**, large and wearing its items. Tapping it makes it hop.
- Below it, the **name sign** (the existing `NameSign`); tapping it opens the name close-up.
- **Feelio** sits small in a corner as the guide. Its line is a "title" `Caption`, with audio where it exists.

**Five objects** around the room, each a tappable picture (new art), at least 72 px:

| Object | Shows | On tap |
|---|---|---|
| **Wardrobe** (`room_wardrobe`) | Doors slightly open; a sparkle when an unlocked item hasn't been worn yet | The dress-up close-up |
| **Gift box** (`room_gift_box`) | A fill level showing progress toward the next item | A close-up with the fill level and a spoken "2 more steps!". When full, the unlock moment (section 3) |
| **Star shelf** (`room_star_shelf`) | One star (`badge_star`) for each finished level, grouped by place | A close-up of the shelf. Unearned spots are soft outlines |
| **Feelings jar** (`room_feelings_jar`) | A glowing bubble for each feeling met in stories | A close-up of the jar. Tapping a bubble says the feeling's name aloud |
| **Pinboard** (`room_pinboard`) | The child's likes, using the `like_*` pictures | The likes close-up: change likes, up to 3, as in onboarding |

**Books:** a small stack (`room_book_stack`) on the bedside table links to `/stories`, with a count. Books have no second home here.

**Close-ups:**
- Opening an object grows it from its place in the room into a full-screen close-up (a shared-layout transition), with one main action and a back button.
- One close-up at a time. No pop-up boxes and no tabs.
- With reduced motion, the transition is a crossfade.

**Layout rules (the owner's top priority):**
- **Landscape:** the character sits a little left of centre on the rug. The wardrobe and pinboard are on the start side; the shelf, jar and gift box on the end side; the book stack on the bedside table.
- **Object positions** are fractions of the scene, held in one data file (`content/room/layout.json`) per orientation, and measured from the room art once it arrives. This is the same method as the place-map stones, so nothing floats off the furniture.
- **Portrait:** character and name at the top. The five objects become a row of large picture buttons along the bottom edge of the room, above the dock.
- **Arabic:** the layout mirrors with logical properties. The character and the art are never mirrored.
- **Gutters and the dock:** every object stays clear of the dock (`--dock-space`) and the exit door. A layout test checks for overlaps at 3 viewports in both languages (see section 7).

## 3. Dress-up and name (section 2)

**The wardrobe close-up:**
- **Left (start side):** the character, large, showing every change instantly.
- **Right (end side):** four rails, one per body area (head, face, neck, back), each marked with an icon. Each rail holds that area's items as large tiles.
- **Unlocked item:** tapping it puts it on, with a small spring "pop" on the character. Tapping the worn item takes it off. One item per body area.
- **Locked item:** shown as a soft silhouette with a gift-ribbon corner. Tapping it says how it's earned ("Make more stories to open this!"). Never "you can't".
- **Colour row:** the 4 existing colours (`avatar_bun_*_idle`), each a large swatch.
- **Saving:** each change is saved at once (optimistic, with a quiet retry). There is no Save button. If saving fails, the change stays on screen and is retried; the child never sees an error.

**Name close-up:** the onboarding name balloons (the existing component): the reviewed list plus "parent" when a parent nickname exists. Picking one updates the sign with a little bounce.

**Likes close-up:** the onboarding likes carousel and toggle (the existing components), up to 3.

## 4. Unlocks (section 3)

**Points, worked out on the server from data the app already stores:**
- 1 per story made (the child's stories, all time)
- 1 per distinct feeling met in stories (at most 8)
- 2 per finished level (from Milestone 4)

**Items:**
- `unlocked = 2 + floor(points / 3)`, capped at the number of items (16).
- The order of unlocks is fixed in `content/room/wardrobe.json`.
- The first 2 items are free, so dress-up works on day one.

**Unlocks never go down.** A parent deleting a story must not take an item away. The profile keeps:
- **`rewardsReached`:** the highest unlock count ever reached.
- **`rewardsSeen`:** how many unlocks the child has already watched open.

These are two small integers on `child_profile`, deleted with the profile, with no other retention. On each visit: `reached = max(reached, computed)`.

**The unlock moment:** when `reached > seen`, the gift box glows. Tapping it opens the box with the approved `ui_celebrate_burst`, the new item flies into the wardrobe, and Feelio says "A new surprise!". Then `seen` moves up by one. If several are waiting, each tap opens the next one. Nothing expires.

**The gift box fill** shows the steps left to the next item (`3 - points % 3`). It's a visual fill plus a spoken count, with no numbers to read.

**No pressure (rule 12):** no streaks, no daily items, no timers, no "come back tomorrow", nothing lost by staying away.

## 5. Data, server and safety

**Character record (`avatar` jsonb) gains an optional `wear` field.**
- Shape: `wear: { head?: id, face?: id, neck?: id, back?: id }`, validated against `wardrobe.json` (zod enums from the data).
- Version 1 records stay valid; `wear` defaults to empty.
- This is the only new child choice stored.

**Two integer columns:** `rewards_reached` and `rewards_seen` (default 0). The migration only adds columns; nothing destructive.

**Server, `child/room.ts` (server-only):**
- `roomState(childId)` returns points, unlocked item ids, the reached and seen counts, worn items, colour, name, likes, the star shelf by place, and the feelings met. It reuses `collection()` from D-071 for stars and feelings.
- `applyRoomUpdate(child, update)` handles every change.

**Route `POST /api/child/room`:**
- Child scope, with the existing same-origin and device-key checks.
- Body: one strict action. `wear {slot, item | null}`, `colour`, `nickname` (list key or "parent"), `interests` (up to 3 ids), or `seen` (moves up by 1 only when `seen < reached`).
- The server refuses an item that isn't unlocked, an unknown id, or the wrong body area. Locked items are enforced on the server (rule 2), not just hidden in the UI.

**Address and menu:** the page moves to `/room`, and `/collection` redirects there. The menu label "My collection" becomes "My room" ("غرفتي"), with the same `dock_collection` icon.

**Safety:** nothing typed, no uploads, no model calls, no new personal data. Names stay from the reviewed list. Parents see no change, by owner decision.

## 6. Art (section 4): Batch 6

The prompts are written into `docs/ASSET_REQUESTS.md` on implementation. Every item is made with `avatar_bun_amber_idle` attached as the reference, so its size and style fit the character.

**Scenes:**
- `scene_my_room_land` and `scene_my_room_port`: a cosy child's bedroom.
- Free spaces where the objects go: an open rug in the middle, a wall space for the pinboard, a corner for the wardrobe, a bedside table.
- No people and no writing.

**Room objects (6, square, transparent):** `room_wardrobe`, `room_gift_box`, `room_star_shelf`, `room_feelings_jar`, `room_pinboard`, `room_book_stack`.

**Wearable items (16, square, transparent).** Each is drawn on its own, front view, with no character in the picture:

| Body area | Items |
|---|---|
| Head | `wear_party_hat`, `wear_flower_crown`, `wear_wizard_hat`, `wear_beanie` |
| Face | `wear_round_glasses`, `wear_star_glasses`, `wear_heart_glasses`, `wear_sunglasses` |
| Neck | `wear_scarf`, `wear_bow_tie`, `wear_flower_garland`, `wear_star_medal` |
| Back | `wear_backpack`, `wear_cape`, `wear_butterfly_wings`, `wear_balloon` |

**Placement:** each item's placement on the character (centre x and y, width, rotation, and whether it sits in front of or behind the body) is measured by me from the delivered art and stored in `wardrobe.json`. The `Avatar` component draws the worn items in layers. Back items go behind the body; the others go in front.

**Until the art arrives:** grey `TODO(PLACEHOLDER)` boxes for the room objects and the items (protocol rule 10). The room stays usable, but items can't be shown on the character without art, so dress-up only becomes visible on delivery.

## 7. Fluidity and testing

**Motion (motion/react):**
- Shared-layout transitions from each object to its close-up.
- Spring "pop" when an item goes on.
- The gift box opening.
- The character's idle breathing.
- Only `transform` and `opacity` animate, never layout properties, and every transition has a reduced-motion version.

**Tests:**
- **Unit:** points and unlock maths (monotonic, cap, free items), wardrobe data validation (every id has art, placement and a body area), and that version 1 records stay valid.
- **Integration:**
  - The route refuses locked, unknown and wrong-area items.
  - `seen` never passes `reached`.
  - Deleting a story doesn't lower `reached`.
  - Name, colour and likes updates are validated.
- **E2E:**
  - Open the wardrobe, wear an item, take it off.
  - Change the name, change a like.
  - The gift box unlock moment.
  - Portrait layout.
  - Arabic RTL.
  - Stories off: the book stack is hidden.
  - **Layout check:** no two room objects, the character, the caption, the dock or the exit door overlap, at 1180×820, 1920×920 and 390×844, in both languages.
- **Screenshots:** reviewed at the same viewports before the commit.

**Retention and deletion:** `wear`, `rewards_reached` and `rewards_seen` live on `child_profile` and are deleted with it (the existing deletion path). They're documented in the retention table.

## 8. Out of scope

- Parent view of the room.
- Trading or sharing.
- Typed names.
- Item shop or currency.
- More character shapes (D-053).
- Room decoration (moving furniture).
