---
name: rtl-i18n-check
description: Use whenever Feelio UI, copy, layout, map or mascot code changes. Checks English and Arabic strings (completeness, no hard-coded text), right-to-left mirroring rules, Arabic typography, and that the mascot and illustrations are never mirrored. Outputs a pass/fail report.
---

# RTL and i18n check (Feelio: English + Arabic)

Feelio ships in English (LTR) and Arabic (RTL), and every feature must work in both (SPEC §1). Run this check on every change to UI, copy, layout, map, mascot or voice prompts, and before every milestone commit together with `child-safety-review`.

## 1. Strings
- [ ] **No hard-coded user-facing text** in components. Every string comes from the message catalogues (`messages/en.json`, `messages/ar.json`, or the library chosen in Milestone 1). Grep JSX and TSX for bare text between tags and for `aria-label="` or `alt="` with literal text.
- [ ] **Key parity:** every key exists in both catalogues. No empty values, and no English text left in the Arabic file (Latin letters in `ar.json` are allowed only for brand names such as "Feelio").
- [ ] **Interpolation and plurals:** ICU plural rules are used. Arabic has six plural forms (zero, one, two, few, many, other); check that they are present wherever counts appear.
- [ ] **Accessible names and audio cues** exist in both languages: hotspot labels, button labels, alt text, and the audio description file references.
- [ ] **Data content** (`content/worlds/*/world.json`, scenarios, crisis resources) has `en` and `ar` for every display field. Crisis resources are per locale and reviewed (SR-15).
- [ ] **Child-facing wording** is short and simple. Arabic uses the agreed register (Modern Standard Arabic unless the owner chose otherwise, BRAND.md B6). Machine-translated text is marked `review_status: draft` until a native speaker reviews it.
- [ ] **Voice:** the agent language and any static audio exist for both locales. Fixed phrases are pre-generated in both.

## 2. Direction and layout
- [ ] `<html lang dir>` is set from the locale (`dir="rtl"` for `ar`).
- [ ] Only **logical CSS properties** are used: `margin-inline-start`, `padding-inline-end`, `inset-inline-start`, `text-align: start`, `border-start-start-radius`. Grep for `left:`, `right:`, `margin-left`, `padding-right`, `text-align: left`, `ml-` and `mr-` (Tailwind: use `ms-` and `me-`), `left-`, `right-`.
- [ ] **Directional icons** (back, next, chevrons, the "walk along the path" direction) flip in RTL. **Non-directional icons** (mic, play, settings, close, search, check) do not. Play/pause and media controls keep LTR orientation, the platform convention.
- [ ] **Gestures:** swipe-to-go-back, carousel order and page-turn direction (stories) follow the reading direction.
- [ ] The **dock order** follows the reading direction (Map first at the start edge).
- [ ] Numbers, times and dates use `Intl` with the locale. Digit style follows the locale setting.
- [ ] Mixed-direction strings (an English brand name inside Arabic) render correctly. Use `<bdi>` or Unicode isolates for user and brand names.

## 3. Mirroring images: the rules
- [ ] **The mascot is NEVER mirrored.** No `scaleX(-1)`, `transform: scale(-1, 1)`, `rotateY(180deg)` or `flip` on any mascot element or its container, in either direction. Facing changes use the separate delivered poses (`mascot_walking_left` / `mascot_walking_right`). Grep for `scaleX(-1)`, `scale(-1`, `rotateY(180`, `flip`.
- [ ] **Companions** (heart, cloud, star), badges, dock icons and story illustrations are never mirrored.
- [ ] **Global maps (D-021):** Arabic uses its own Arabic-sign map (`assets.ar` in world.json). English uses the English map. **Maps with painted words are never mirrored.** Mirroring (`rtl_mirror: "mirror"`, image and `x → 1 − x` together) is allowed only for a `label_mode: "blank_signs"` map. Badges, labels and the mascot marker are never mirrored.
- [ ] Delivered Arabic maps: every sign word read and checked against the expected word (البيت، الحديقة، المدرسة، النادي، السوق), with correctly joined letters.
- [ ] **Vertical map:** not mirrored (the journey runs bottom to top).
- [ ] Mascot walking direction is chosen from the **on-screen** movement vector after mirroring, never from data order.

## 4. Arabic typography
- [ ] Baloo Bhaijaan 2 (OFL) is loaded for Arabic, or ff yaseer once licensed (D-023), with a fallback stack. Balsamiq Sans is used for Latin.
- [ ] No letter-spacing on Arabic text (it breaks the joining). No `text-transform`, no faux italics.
- [ ] Line height is at least 1.6 for Arabic. Check that diacritics are not clipped in buttons and chips (test with a string containing tashkeel).
- [ ] No script or display font is used for Arabic, and no Latin-only font is applied to Arabic text.
- [ ] Truncation and ellipsis work in RTL. Avoid truncating child-facing text at all.

## 5. Tests
- [ ] The e2e suite runs each touched screen in `en` and `ar`, with screenshots in both, in portrait and landscape (Playwright MCP or `@playwright/test`).
- [ ] The map e2e test checks the RTL layout: hotspots under the right places after mirroring, and the mascot not mirrored (computed transform has no negative x-scale).
- [ ] The pseudo-locale or long-string test shows no overflow.

## Report format
```
## RTL/i18n check: <change> (<date>)
Result: PASS | FAIL (n)
| § | Item | Result | Evidence / fix |
Missing keys: en→ar [...], ar→en [...]
```
