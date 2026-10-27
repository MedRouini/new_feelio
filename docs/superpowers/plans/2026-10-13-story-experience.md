# Story experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the library (`/stories`), the theatre (`/make`) and the storybook (`/stories/<id>`) into one touch-first storytelling experience, built on a shared button system (action objects, pressables, choice discs).

**Architecture:**
- Three new shared components in `child/ui/` (`Pressable`, `ActionObject`, `ChoiceDisc`), with their state logic in a pure helper (`child/ui/press.ts`) that is unit-tested.
- The theatre gets a new `StageCarousel`, its index maths in `child/ui/carousel.ts` (pure, unit-tested), plus step tickets and a stage that shows the chosen pictures.
- The library and storybook are re-laid out around the same components.
- Data flows, routes and safety are untouched.

**Tech Stack:** Next.js 16, React, TypeScript, motion/react, next-intl, lucide-react (functional icons only), Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-13-story-experience-design.md`

## Global Constraints

- **Priorities:** child safety > emotional usefulness > brand consistency > UX quality > number of features.
- **No change** to routes, request bodies, server checks, caps, voice or data.
- **Touch-first:**
  - nothing depends on hover
  - targets ≥ 72 px (`--touch-child`), ≥ 12 px apart
  - `touch-action: manipulation`
  - feedback on `pointerdown`
  - every control works by tap, click and keyboard, with a visible focus ring (4 px navy, offset 4 px)
- **No pills, no shadows, no blur:**
  - pressables are chunky rounded squares (radius 22 px) on a solid 6 px base layer
  - only `transform` and `opacity` animate
  - every motion has a calm version (`useCalm()`)
- **Art:**
  - only approved assets
  - Batch 7 ids: `ui_btn_make_story`, `ui_btn_curtain_rope`, `ui_btn_read_aloud`, `ui_step_hero`, `ui_step_place`, `ui_step_adventure`
  - approved reuse: `ui_mic_object`, `face_happy`
  - art and story pictures are never mirrored
- **i18n:** every new string goes in `messages/en.json` and `messages/ar.json`; logical properties for layout.
- **Test ids that existing E2E tests rely on stay:** `make-story`, `book`, `open-book`, `next-page`, `read-to-me`, `make-it`, `story-voice`, `choice-picker`, `choose-this`, `slot-<slot>`, `workshop-line`, `ai-line`, `book-wrap`, `page-<n>`.
- **Commits:** repo-local identity, no `Co-Authored-By` trailer. Branch `story-experience`.
- **Commands:** `npm run lint`, `npx tsc --noEmit -p .`, `npx vitest run`, `npx playwright test` (dev server on port 3000).

## Review Focus

1. **A child taps the carousel's middle picture while it is still sliding** (fast swipe then tap): the picture that ends in the middle is picked, never the one that was passing. Pinned in Task 2 (`pickOnTap` uses the settled index) and Task 9 (touch E2E).
2. **A drag that ends on the middle disc:** a swipe must not also count as a tap-to-pick. Pinned in Task 2 (`isTap` threshold) and Task 9.
3. **A double tap on the curtain rope or "make another":** only one story request is sent. Pinned in Task 6 (rope `loading` blocks a second press) and Task 9.
4. **Arabic:** arrows, swipe direction and page corners follow the reading direction, while the stage pictures and art never mirror. Pinned in Task 2 (direction maths) and Task 9 (Arabic E2E).
5. **Keyboard users:** focus lands on a visible element after picking (the next step's carousel), and never disappears into a removed element. Pinned in Task 6 and Task 9 (keyboard E2E).

---

### Task 1: Press state helper and the `Pressable` component

**Files:**
- Create: `child/ui/press.ts`, `child/ui/Pressable.tsx`, `child/ui/pressable.module.css`
- Test: `tests/unit/press.test.ts`

**Interfaces:**
- Produces:
  - `type PressState = { loading?: boolean; disabled?: boolean; selected?: boolean; resting?: boolean }`
  - `pressAttrs(s: PressState): Record<string, string | boolean | undefined>`, which returns `aria-busy`, `aria-disabled`, `data-loading`, `data-disabled`, `data-selected` and `data-resting`
  - `canPress(s: PressState): boolean`, false when loading or disabled; resting can still be pressed, because pressing it explains why
  - `<Pressable tone="primary"|"plain"|"night" shape="round"|"wide" label icon? href? onPress? selected? current? loading? disabled? testId? className?>`: a `<button>`, or an `<a>` when `href`, with `aria-label` = `label` for round

- [ ] **Step 1: Write the failing test** `tests/unit/press.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { canPress, pressAttrs } from "@/child/ui/press";

describe("press states", () => {
  it("maps states to attributes", () => {
    expect(pressAttrs({})).toEqual({ "aria-busy": undefined, "aria-disabled": undefined, "data-loading": undefined, "data-disabled": undefined, "data-selected": undefined, "data-resting": undefined });
    expect(pressAttrs({ loading: true })["aria-busy"]).toBe(true);
    expect(pressAttrs({ disabled: true })["aria-disabled"]).toBe(true);
    expect(pressAttrs({ selected: true })["data-selected"]).toBe(true);
    expect(pressAttrs({ resting: true })["data-resting"]).toBe(true);
  });
  it("blocks presses while loading or disabled, not while resting", () => {
    expect(canPress({})).toBe(true);
    expect(canPress({ loading: true })).toBe(false);
    expect(canPress({ disabled: true })).toBe(false);
    expect(canPress({ resting: true })).toBe(true);
  });
});
```

- [ ] **Step 2: Run it.** `npx vitest run tests/unit/press.test.ts`. Expected: FAIL (cannot find `@/child/ui/press`).

- [ ] **Step 3: Implement `child/ui/press.ts`**

```ts
// Shared press states for the child app's buttons (D-075): one mapping to attributes, so every
// pressable, action object and choice looks and announces the same state the same way.
export type PressState = { loading?: boolean; disabled?: boolean; selected?: boolean; resting?: boolean };

export function pressAttrs(s: PressState) {
  return {
    "aria-busy": s.loading || undefined,
    "aria-disabled": s.disabled || undefined,
    "data-loading": s.loading || undefined,
    "data-disabled": s.disabled || undefined,
    "data-selected": s.selected || undefined,
    "data-resting": s.resting || undefined,
  };
}

/** Loading or disabled controls ignore presses; a resting one still answers (Feelio says why). */
export function canPress(s: PressState): boolean {
  return !s.loading && !s.disabled;
}
```

- [ ] **Step 4: Implement `child/ui/Pressable.tsx`**

```tsx
"use client";

import type { ReactNode } from "react";
import { play } from "./sound";
import { canPress, pressAttrs } from "./press";
import styles from "./pressable.module.css";

/**
 * Everyday controls in the child app (D-075): a chunky rounded square sitting on a solid base layer that
 * it sinks into when pressed. No shadow, no pill. Round for icon-only controls, wide with a word.
 */
export function Pressable({
  label,
  icon,
  shape = "wide",
  tone = "plain",
  href,
  onPress,
  selected,
  current,
  loading,
  disabled,
  showLabel = shape === "wide",
  className,
  testId,
  children,
}: {
  label: string;
  icon?: ReactNode;
  shape?: "round" | "wide";
  tone?: "primary" | "plain" | "night";
  href?: string;
  onPress?: () => void;
  selected?: boolean;
  current?: "step" | "page" | true;
  loading?: boolean;
  disabled?: boolean;
  showLabel?: boolean;
  className?: string;
  testId?: string;
  children?: ReactNode;
}) {
  const state = { loading, disabled, selected };
  const inner = (
    <span className={styles.face}>
      {loading ? (
        <span className={styles.dots} aria-hidden>
          <i />
          <i />
          <i />
        </span>
      ) : (
        <>
          {icon}
          {children}
          {showLabel ? <span className={styles.word}>{label}</span> : null}
        </>
      )}
    </span>
  );
  const common = {
    className: [styles.pressable, className].filter(Boolean).join(" "),
    "data-shape": shape,
    "data-tone": tone,
    "aria-label": showLabel ? undefined : label,
    "aria-current": current,
    "data-testid": testId,
    ...pressAttrs(state),
  };
  if (href)
    return (
      <a href={href} {...common} onClick={() => play("tap")}>
        {inner}
      </a>
    );
  return (
    <button
      type="button"
      {...common}
      aria-pressed={selected === undefined ? undefined : selected}
      onClick={() => {
        if (!canPress(state)) return;
        play("tap");
        onPress?.();
      }}
    >
      {inner}
    </button>
  );
}
```

- [ ] **Step 5: Write `child/ui/pressable.module.css`**

```css
/* Pressable (D-075): a face on a solid base layer (a darker shade, 6 px deep). Pressing sinks the face
   into the base. Only transform and opacity animate; no shadow, no pill, no hover-only behaviour. */
.pressable {
  --depth: 6px;
  --face: var(--white);
  --base: #c9b3ee;
  --ink: var(--purple-500);
  position: relative;
  display: inline-grid;
  min-inline-size: var(--touch-child);
  min-block-size: calc(var(--touch-child) + var(--depth));
  padding: 0 0 var(--depth);
  border: 0;
  background: none;
  color: var(--ink);
  font: inherit;
  text-decoration: none;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}
/* the base the face sits on */
.pressable::before { content: ""; position: absolute; inset: var(--depth) 0 0; border-radius: 22px; background: var(--base); }
.face {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--s2);
  min-block-size: var(--touch-child);
  padding-inline: var(--s5, 24px);
  border-radius: 22px;
  border: 3px solid var(--base);
  background: var(--face);
  font-size: var(--fs-word);
  font-weight: 700;
  transition: transform 120ms var(--ease-out);
}
.pressable[data-shape="round"] .face { inline-size: var(--touch-child); padding: 0; border-radius: 50%; }
.pressable[data-shape="round"]::before { border-radius: 50%; }
.pressable:active .face, .pressable[data-pressed] .face { transform: translateY(var(--depth)); }
@media (hover: hover) { .pressable:hover:not([aria-disabled]) .face { transform: translateY(-2px); } }
.pressable:focus-visible { outline: none; }
.pressable:focus-visible .face { outline: 4px solid var(--navy-900); outline-offset: 4px; }

.pressable[data-tone="primary"] { --face: var(--accent); --base: #c97f1c; --ink: var(--navy-900); }
.pressable[data-tone="night"] { --face: var(--purple-500); --base: #3b2a75; --ink: var(--white); }
.pressable[data-selected], .pressable[aria-current] { --face: var(--accent); --base: #c97f1c; --ink: var(--navy-900); }
.pressable[data-disabled] { cursor: default; }
.pressable[data-disabled] .face { transform: translateY(var(--depth)); opacity: 0.5; }
.pressable[data-loading] .face { cursor: progress; }

.word { line-height: 1.1; }
.dots { display: inline-flex; gap: 6px; }
.dots i { inline-size: 10px; block-size: 10px; border-radius: 50%; background: currentColor; opacity: 0.4; }
@media (prefers-reduced-motion: no-preference) {
  .dots i { animation: dot 900ms ease-in-out infinite; }
  .dots i:nth-child(2) { animation-delay: 150ms; }
  .dots i:nth-child(3) { animation-delay: 300ms; }
}
@keyframes dot { 0%, 100% { opacity: 0.35; } 50% { opacity: 1; } }
```

If `--s5` isn't defined in `app/globals.css`, the fallback `24px` applies; leave it.

- [ ] **Step 6: Run the tests, typecheck and lint.** `npx vitest run tests/unit/press.test.ts && npx tsc --noEmit -p . && npm run lint`. Expected: PASS, clean.

- [ ] **Step 7: Commit.** `git add child/ui/press.ts child/ui/Pressable.tsx child/ui/pressable.module.css tests/unit/press.test.ts && git commit -m "Story experience: press states and the Pressable control"`

---

### Task 2: Carousel maths

**Files:**
- Create: `child/ui/carousel.ts`
- Test: `tests/unit/carousel.test.ts`

**Interfaces:**
- Produces:
  - `wrap(i: number, n: number): number`
  - `offsetFrom(i: number, index: number, n: number): number`: the shortest signed distance
  - `swipeStep(dx: number, rtl: boolean, threshold?: number): 1 | -1 | 0`: 40 px threshold; swiping toward the reading start brings the next item
  - `keyStep(key: string, rtl: boolean): 1 | -1 | 0`
  - `isTap(dx: number, dy: number): boolean`: true below 12 px of movement
  - `pickOnTap(tapped: number, settled: number): "pick" | "centre"`: picks only when the tapped item is the settled middle

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { isTap, keyStep, offsetFrom, pickOnTap, swipeStep, wrap } from "@/child/ui/carousel";

describe("carousel maths", () => {
  it("wraps indexes", () => {
    expect(wrap(-1, 8)).toBe(7);
    expect(wrap(8, 8)).toBe(0);
    expect(wrap(3, 8)).toBe(3);
  });
  it("measures the shortest distance from the middle", () => {
    expect(offsetFrom(7, 0, 8)).toBe(-1);
    expect(offsetFrom(1, 0, 8)).toBe(1);
    expect(offsetFrom(4, 0, 8)).toBe(4);
  });
  it("turns swipes into steps in the reading direction", () => {
    expect(swipeStep(-80, false)).toBe(1);
    expect(swipeStep(80, false)).toBe(-1);
    expect(swipeStep(-80, true)).toBe(-1);
    expect(swipeStep(20, false)).toBe(0);
  });
  it("maps arrow keys, mirrored in Arabic", () => {
    expect(keyStep("ArrowRight", false)).toBe(1);
    expect(keyStep("ArrowRight", true)).toBe(-1);
    expect(keyStep("ArrowLeft", false)).toBe(-1);
    expect(keyStep("Enter", false)).toBe(0);
  });
  it("tells a tap from a drag", () => {
    expect(isTap(4, 3)).toBe(true);
    expect(isTap(30, 0)).toBe(false);
  });
  it("picks only the settled middle", () => {
    expect(pickOnTap(2, 2)).toBe("pick");
    expect(pickOnTap(3, 2)).toBe("centre");
  });
});
```

- [ ] **Step 2: Run it.** `npx vitest run tests/unit/carousel.test.ts`. Expected: FAIL (module missing).

- [ ] **Step 3: Implement `child/ui/carousel.ts`**

```ts
// Carousel maths (D-075), pure: shared by the theatre carousel and its tests. The reading direction
// decides which way a swipe or an arrow key moves; the pictures themselves never mirror.
export const wrap = (i: number, n: number) => ((i % n) + n) % n;

export function offsetFrom(i: number, index: number, n: number): number {
  let o = i - index;
  if (o > n / 2) o -= n;
  if (o < -n / 2) o += n;
  return o;
}

/** Swiping toward the reading start brings the next item in. */
export function swipeStep(dx: number, rtl: boolean, threshold = 40): 1 | -1 | 0 {
  if (Math.abs(dx) < threshold) return 0;
  return (dx < 0) !== rtl ? 1 : -1;
}

export function keyStep(key: string, rtl: boolean): 1 | -1 | 0 {
  if (key === "ArrowRight") return rtl ? -1 : 1;
  if (key === "ArrowLeft") return rtl ? 1 : -1;
  return 0;
}

/** A press that moved less than this is a tap; more is a drag (never both). */
export const isTap = (dx: number, dy: number) => Math.hypot(dx, dy) < 12;

/** Tapping the settled middle picks it; tapping any other picture brings it to the middle. */
export const pickOnTap = (tapped: number, settled: number): "pick" | "centre" => (tapped === settled ? "pick" : "centre");
```

- [ ] **Step 4: Run it.** Expected: PASS (6 tests).

- [ ] **Step 5: Commit.** `git add child/ui/carousel.ts tests/unit/carousel.test.ts && git commit -m "Story experience: carousel maths (tap vs drag, reading direction)"`

---

### Task 3: `ActionObject` and `ChoiceDisc`

**Files:**
- Create: `child/ui/ActionObject.tsx`, `child/ui/actionObject.module.css`, `child/ui/ChoiceDisc.tsx`, `child/ui/choiceDisc.module.css`
- Modify: `messages/en.json`, `messages/ar.json` (`child.ui.resting`)

**Interfaces:**
- Consumes: `pressAttrs`, `canPress` (Task 1).
- Produces:
  - `<ActionObject art label href? onPress? ready? loading? loadingLabel? resting? restingLabel? done? sizes className testId>`: the object plus a label plate
  - `<ChoiceDisc art? word selected? size="lg"|"md"|"sm" />`: presentational, placed inside a button by its user

- [ ] **Step 1: Write `ActionObject.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Moon } from "lucide-react";
import { AssetImage } from "@/design/components/AssetImage";
import type { AssetId } from "@/design/asset-ids";
import { play } from "./sound";
import { canPress, pressAttrs } from "./press";
import styles from "./actionObject.module.css";

/**
 * The few big actions in the child app (D-075): a tappable illustrated object with a short label plate.
 * Ready glows, loading wobbles, done sparkles once, resting shows a moon and still answers.
 */
export function ActionObject({
  art,
  label,
  href,
  onPress,
  ready,
  loading,
  loadingLabel,
  resting,
  sizes,
  className,
  testId,
}: {
  art: AssetId;
  label: string;
  href?: string;
  onPress?: () => void;
  ready?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  resting?: boolean;
  sizes: string;
  className?: string;
  testId?: string;
}) {
  const [pop, setPop] = useState(0);
  const state = { loading, resting };
  const inner = (
    <>
      <span key={pop} className={styles.object} data-pop={pop ? true : undefined}>
        <AssetImage id={art} alt="" sizes={sizes} className={styles.art} />
        {resting ? (
          <span className={styles.moon} aria-hidden>
            <Moon size={22} strokeWidth={3} />
          </span>
        ) : null}
      </span>
      <span className={styles.plate}>{loading && loadingLabel ? loadingLabel : label}</span>
    </>
  );
  const common = {
    className: [styles.action, className].filter(Boolean).join(" "),
    "data-ready": ready || undefined,
    "data-testid": testId,
    ...pressAttrs(state),
  };
  if (href)
    return (
      <a href={href} {...common} onClick={() => (play("pick"), setPop((p) => p + 1))}>
        {inner}
      </a>
    );
  return (
    <button
      type="button"
      {...common}
      onClick={() => {
        if (!canPress(state)) return;
        play(resting ? "tap" : "pick");
        setPop((p) => p + 1);
        onPress?.();
      }}
    >
      {inner}
    </button>
  );
}
```

- [ ] **Step 2: Write `actionObject.module.css`**

```css
/* Action objects (D-075): illustrated objects for the big actions. Only transform and opacity animate;
   the ready halo is an opacity animation on a flat amber disc behind the art (no blur, no shadow). */
.action {
  position: relative;
  display: inline-grid;
  justify-items: center;
  gap: 4px;
  min-inline-size: 96px;
  border: 0;
  padding: 0;
  background: none;
  color: var(--navy-900);
  font: inherit;
  text-decoration: none;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}
.object { position: relative; display: block; inline-size: 100%; transition: transform 140ms var(--ease-out); }
.object::before { content: ""; position: absolute; inset: 8%; border-radius: 50%; background: radial-gradient(circle, rgb(243 176 58 / 0.55), rgb(243 176 58 / 0) 70%); opacity: 0; }
.art { position: relative; inline-size: 100%; }
.action:active .object { transform: scale(0.92); }
.action:focus-visible { outline: none; }
.action:focus-visible .plate { outline: 4px solid var(--navy-900); outline-offset: 4px; }
.plate {
  padding: 6px 14px;
  border-radius: 14px 14px 14px 4px;
  background: var(--white);
  border: 3px solid var(--accent);
  font-size: var(--fs-word);
  font-weight: 700;
  line-height: 1.1;
  text-align: center;
  text-wrap: balance;
}
:global(html[dir="rtl"]) .plate { border-radius: 14px 14px 4px 14px; }
.moon { position: absolute; inset-block-start: 4%; inset-inline-end: 4%; display: grid; place-items: center; inline-size: 34px; block-size: 34px; border-radius: 50%; background: var(--purple-500); color: var(--white); }
.action[data-resting] .art { opacity: 0.55; }
.action[data-loading] { cursor: progress; }
@media (prefers-reduced-motion: no-preference) {
  .object { animation: breathe 3.2s ease-in-out infinite; }
  .object[data-pop] { animation: pop 380ms var(--ease-spring); }
  .action[data-ready] .object::before { animation: halo 1.6s ease-in-out infinite; }
  .action[data-loading] .object { animation: wobble 900ms ease-in-out infinite; }
}
.action[data-ready] .object::before { opacity: 0.8; }
@keyframes breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.03); } }
@keyframes pop { 0% { transform: scale(0.88); } 60% { transform: scale(1.08); } 100% { transform: scale(1); } }
@keyframes halo { 0%, 100% { opacity: 0.35; } 50% { opacity: 1; } }
@keyframes wobble { 0%, 100% { transform: rotate(-4deg); } 50% { transform: rotate(4deg); } }
```

- [ ] **Step 3: Write `ChoiceDisc.tsx` and `choiceDisc.module.css`**

```tsx
import { Check } from "lucide-react";
import { AssetImage } from "@/design/components/AssetImage";
import type { AssetId } from "@/design/asset-ids";
import styles from "./choiceDisc.module.css";

/** A choice on a round stage-light disc (D-075): its picture, or its word when there's no picture. */
export function ChoiceDisc({ art, word, selected, size = "md" }: { art?: AssetId | null; word: string; selected?: boolean; size?: "lg" | "md" | "sm" }) {
  return (
    <span className={styles.disc} data-size={size} data-selected={selected || undefined} data-word={art ? undefined : true}>
      {art ? <AssetImage id={art} alt="" sizes={size === "lg" ? "28vmin" : "16vmin"} className={styles.art} /> : <span className={styles.word}>{word}</span>}
      {selected ? (
        <span className={styles.check} aria-hidden>
          <Check size={22} strokeWidth={3.5} />
        </span>
      ) : null}
    </span>
  );
}
```

```css
/* Choice discs (D-075): a picture on a round pool of stage light (a flat radial gradient). */
.disc {
  position: relative;
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  inline-size: 100%;
  border-radius: 50%;
  border: 4px solid var(--lilac-300);
  background: radial-gradient(circle at 50% 40%, #fff8ec 0%, #ffe6ba 55%, #f6d4a0 100%);
  padding: 12%;
}
.disc[data-selected] { border: 6px solid var(--accent); }
.art { inline-size: 100%; }
.word { font-size: clamp(16px, 2.6vmin + 4px, 26px); font-weight: 700; color: var(--navy-900); text-align: center; line-height: 1.15; text-wrap: balance; }
.check { position: absolute; inset-block-start: 2%; inset-inline-end: 2%; display: grid; place-items: center; inline-size: 34px; block-size: 34px; border-radius: 50%; background: var(--accent); color: var(--navy-900); }
@media (prefers-reduced-motion: no-preference) {
  .disc[data-selected] { animation: bob 2.4s ease-in-out infinite; }
}
@keyframes bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
```

- [ ] **Step 4: Typecheck and lint.** `npx tsc --noEmit -p . && npm run lint`. Expected: clean.

- [ ] **Step 5: Commit.** `git add child/ui/ActionObject.tsx child/ui/actionObject.module.css child/ui/ChoiceDisc.tsx child/ui/choiceDisc.module.css && git commit -m "Story experience: ActionObject and ChoiceDisc"`

---

### Task 4: The theatre carousel (`StageCarousel`)

**Files:**
- Create: `app/child/stories/make/StageCarousel.tsx`, `app/child/stories/make/stageCarousel.module.css`

**Interfaces:**
- Consumes: `wrap`, `offsetFrom`, `swipeStep`, `keyStep`, `isTap`, `pickOnTap` (Task 2); `Pressable` (Task 1); `ChoiceDisc` (Task 3).
- Produces: `<StageCarousel items: {id, word, art}[] index onIndex onPick label prevLabel nextLabel chooseLabel rtl selectedId testId="choice-picker" />`. Test ids: `slide-<id>`, `choose-this` (the "Choose" plate under the middle).

- [ ] **Step 1: Write `StageCarousel.tsx`**

```tsx
"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ChoiceDisc } from "@/child/ui/ChoiceDisc";
import { Pressable } from "@/child/ui/Pressable";
import { isTap, keyStep, offsetFrom, pickOnTap, swipeStep, wrap } from "@/child/ui/carousel";
import { play } from "@/child/ui/sound";
import { useCalm } from "@/child/ui/useCalm";
import type { AssetId } from "@/design/asset-ids";
import styles from "./stageCarousel.module.css";

type Item = { id: string; word: string; art: AssetId | null };

/**
 * The theatre's carousel (D-075): choices on stage-light discs along the front of the stage. Swipe or
 * drag, the arrow pressables or the arrow keys move it; tapping a side disc brings it to the middle;
 * tapping the middle (or its "Choose" plate, or Enter) picks it. A drag never counts as a tap.
 */
export function StageCarousel({ items, index, onIndex, onPick, label, prevLabel, nextLabel, chooseLabel, rtl, selectedId, testId }: {
  items: Item[];
  index: number;
  onIndex: (i: number) => void;
  onPick: (item: Item) => void;
  label: string;
  prevLabel: string;
  nextLabel: string;
  chooseLabel: string;
  rtl: boolean;
  selectedId?: string;
  testId?: string;
}) {
  const calm = useCalm();
  const n = items.length;
  const track = useRef<HTMLDivElement>(null);
  const press = useRef<{ x: number; y: number; id: number } | null>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  const go = (to: number) => {
    const i = wrap(to, n);
    if (i === index) return;
    play("step");
    onIndex(i);
  };
  const step = (d: 1 | -1) => go(index + d);
  const centre = items[index];

  const down = (e: PointerEvent) => (press.current = { x: e.clientX, y: e.clientY, id: e.pointerId });
  const up = (e: PointerEvent, tapped?: number) => {
    const p = press.current;
    press.current = null;
    if (!p || p.id !== e.pointerId) return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    if (!isTap(dx, dy)) {
      const s = swipeStep(dx, rtl);
      if (s) step(s);
      return;
    }
    if (tapped === undefined) return;
    if (pickOnTap(tapped, index) === "pick") onPick(items[tapped]);
    else go(tapped);
  };
  const key = (e: KeyboardEvent) => {
    const s = keyStep(e.key, rtl);
    if (s) {
      e.preventDefault();
      step(s);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onPick(centre);
    }
  };
  const Prev = rtl ? ChevronRight : ChevronLeft;
  const Next = rtl ? ChevronLeft : ChevronRight;
  const spring = calm ? { duration: 0 } : { type: "spring" as const, stiffness: 280, damping: 28 };
  const spacing = Math.min(0.2, 150 / Math.max(width, 1));

  return (
    <div className={styles.carousel} role="group" aria-roledescription="carousel" aria-label={label} data-testid={testId}>
      <Pressable shape="round" tone="plain" label={prevLabel} icon={<Prev size={34} strokeWidth={3} aria-hidden />} onPress={() => step(-1)} className={styles.arrow} />
      <div ref={track} className={styles.track} tabIndex={0} aria-label={`${label}: ${centre.word}`} onKeyDown={key} onPointerDown={down} onPointerUp={(e) => up(e)} onPointerCancel={() => (press.current = null)}>
        {items.map((it, i) => {
          const o = offsetFrom(i, index, n);
          const shown = Math.abs(o) <= 2;
          const mid = o === 0;
          return (
            <motion.button
              key={it.id}
              type="button"
              tabIndex={-1}
              className={styles.slide}
              data-centre={mid || undefined}
              aria-hidden={!shown || undefined}
              aria-label={it.word}
              onPointerDown={(e) => (e.stopPropagation(), down(e))}
              onPointerUp={(e) => (e.stopPropagation(), up(e, i))}
              onClick={(e) => {
                // keyboard/assistive activation (no pointer): same rule as a tap
                if (e.detail === 0) (mid ? onPick(it) : go(i));
              }}
              initial={false}
              animate={{ x: (rtl ? -o : o) * spacing * width, scale: mid ? 1 : Math.abs(o) === 1 ? 0.62 : 0.42, opacity: shown ? (mid ? 1 : Math.abs(o) === 1 ? 0.9 : 0.45) : 0, zIndex: 10 - Math.abs(o) }}
              transition={spring}
              style={{ pointerEvents: shown ? "auto" : "none" }}
              data-testid={`slide-${it.id}`}
            >
              <ChoiceDisc art={it.art} word={it.word} selected={it.id === selectedId} size={mid ? "lg" : "md"} />
              {mid ? <span className={styles.name}>{it.word}</span> : null}
            </motion.button>
          );
        })}
      </div>
      <Pressable shape="round" tone="plain" label={nextLabel} icon={<Next size={34} strokeWidth={3} aria-hidden />} onPress={() => step(1)} className={styles.arrow} />
      <Pressable tone="primary" label={chooseLabel} onPress={() => onPick(centre)} className={styles.choose} testId="choose-this" />
    </div>
  );
}
```

- [ ] **Step 2: Write `stageCarousel.module.css`**

```css
/* The theatre carousel (D-075): the middle disc is big and lit; neighbours shrink and fade. */
.carousel { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; grid-template-rows: auto auto; align-items: center; justify-items: center; gap: var(--s2) var(--s3); inline-size: 100%; }
.track { position: relative; grid-column: 2; inline-size: 100%; block-size: clamp(150px, 24vmin, 230px); display: grid; place-items: center; touch-action: pan-y; outline: none; }
.track:focus-visible { outline: 4px solid var(--white); outline-offset: 6px; border-radius: 28px; }
.slide { position: absolute; inline-size: clamp(130px, 21vmin, 200px); display: grid; justify-items: center; gap: 4px; border: 0; padding: 0; background: none; cursor: pointer; touch-action: pan-y; -webkit-tap-highlight-color: transparent; }
.name { font-size: var(--fs-word); font-weight: 700; color: var(--white); -webkit-text-stroke: 5px #3b2a75; paint-order: stroke fill; white-space: nowrap; }
.arrow { grid-row: 1; }
.choose { grid-column: 1 / -1; grid-row: 2; }
```

- [ ] **Step 3: Typecheck and lint.** Expected: clean.

- [ ] **Step 4: Commit.** `git add app/child/stories/make/StageCarousel.tsx app/child/stories/make/stageCarousel.module.css && git commit -m "Story experience: theatre carousel (tap the middle to pick)"`

---

### Task 5: Messages and fixed voice lines

**Files:**
- Modify: `messages/en.json`, `messages/ar.json` (`child.stories`), `safety/voice-lines/lines.ts`

- [ ] **Step 1: Add the strings to `child.stories`**

  **en:**
  ```json
  "choose": "Choose",
  "steps": { "label": "Your story so far", "done": "{slot}: {choice}", "now": "{slot}: choose now", "next": "{slot}: next" },
  "rope": "Make my story!",
  "makeNew": "Make a new story",
  "myBooks": "My books",
  "firstStory": "Let's make your very first story!",
  "openBook": "Open",
  "readAloud": "Read it to me",
  "stop": "Stop",
  "bookmark": "Page {n}",
  "home": "Back to my books",
  "resting": "Not right now"
  ```

  **ar:**
  ```json
  "choose": "اختر",
  "steps": { "label": "قصتك حتى الآن", "done": "{slot}: {choice}", "now": "{slot}: اختر الآن", "next": "{slot}: التالي" },
  "rope": "اصنع قصتي!",
  "makeNew": "اصنع قصة جديدة",
  "myBooks": "كتبي",
  "firstStory": "هيا نصنع أول قصة لك!",
  "openBook": "افتح",
  "readAloud": "اقرأها لي",
  "stop": "توقف",
  "bookmark": "الصفحة {n}",
  "home": "العودة إلى كتبي",
  "resting": "ليس الآن"
  ```

- [ ] **Step 2: Add the fixed voice lines** to `safety/voice-lines/lines.ts`:

  ```ts
  stories_firstStory: "child.stories.firstStory",
  stories_hello: "child.stories.hello",
  stories_ready: "child.stories.ready",
  ```

  Generate them with `npx tsx --env-file=.env safety/voice-lines/generate.ts --locale en --yes`, rerunning if a Windows file lock interrupts it. Then rebuild the indexes: `npx tsx scripts/build-assets.ts`.

- [ ] **Step 3: Commit** the messages, `lines.ts`, the lock file and `public/audio/en/stories_*.mp3`.

---

### Task 6: The theatre (`Workshop`)

**Files:**
- Modify: `app/child/stories/make/Workshop.tsx` (render part), `app/child/stories/make/workshop.module.css` (rewrite)
- Create: `app/child/stories/make/StepTickets.tsx`

**Interfaces:**
- Consumes: `StageCarousel` (Task 4), `Pressable` (Task 1), `ActionObject` (Task 3), `choiceArt`, `STORY_ART`.
- Keeps unchanged:
  - all state, `choose()`, `make()`, voice, and `fill()` logic
  - the server calls
  - the test ids `slot-<slot>` (now the tickets), `workshop-line`, `ai-line`, `make-it` (the rope), `story-voice` (the mic), `choice-picker`

**Steps:**

- [ ] **Step 1: `StepTickets.tsx`.** A row of 4 `Pressable`s (`shape="wide"`, `tone="night"`, `aria-current="step"` on the active one, `selected` on filled ones).
  - **Inside each:** the step's icon (`ui_step_hero` / `ui_step_place` / `face_happy` / `ui_step_adventure`), or the chosen picture via `choiceArt`, as a 44 px `AssetImage`, plus the word (the slot name, or the chosen word).
  - **Accessible name:** `steps.done`, `steps.now` or `steps.next`.
  - `data-testid={"slot-"+slot}`, `onPress={() => openSlot(slot)}`.
  - **The ticket notch:** a `clip-path` polygon on the face, with 10 px notches at the middle of both sides.

- [ ] **Step 2: Stage parts become pictures** (in `Workshop.tsx`), plain `<button>`s with `data-testid={"stage-"+slot}` that call `openSlot`:
  - **Hero:** its art at 30vmin in the spotlight (`layoutId={"pick-hero"}`, a fade when calm), or, when empty, `ui_step_hero` at 40% opacity.
  - **Place:** its art large (60% of the stage width, 0.9 opacity) as a set piece behind the hero; the existing `data-place` gradients colour the stage.
  - **Feeling:** a lamp at the top with `face_<id>` (or `face_happy` at 40% when empty); the existing `data-feeling` lights.
  - **Adventure:** its art at stage right, 18vmin, or `ui_step_adventure` at 40% when empty.
  - **Remove** the word labels (`.partLabel`) from the stage; the words are on the tickets.

- [ ] **Step 3: Replace the props area** with `<StageCarousel>`:
  - **Items:** `lists[active]`, mapped to `{ id, word: label(c), art: pickOptional(choiceArt(active, c.id)) }`.
  - **Props:** `index`, `onIndex`, `onPick={(it) => void choose(active, lists[active].find(c => c.id === it.id)!)}`, `selectedId={filled[active]?.id}`, `label={t("ask."+active)}`, `chooseLabel={t("choose")}`.
  - **Focus after a pick:** move focus to the carousel track of the next step, through a `ref` and `focus({ preventScroll: true })` in an effect on `active`, only when the previous focus was inside the carousel.

- [ ] **Step 4: Actions.**
  - **The rope:** `{complete ? <ActionObject art="ui_btn_curtain_rope" label={t("rope")} ready={!making} loading={making} loadingLabel={t("writing")} onPress={() => void make()} sizes="18vmin" testId="make-it" /> : null}`. `loading` blocks a second press, through `canPress`.
  - **The mic:** `{voice && !making ? <ActionObject art="ui_mic_object" label={live ? t("stopTalking") : t("tellFeelio")} ready={live} onPress={() => (live ? v.stop() : void v.start())} sizes="12vmin" testId="story-voice" /> : null}`.

- [ ] **Step 5: Rewrite `workshop.module.css`.**

  **Landscape grid areas:**
  ```
  "ai ai"
  "question question"
  "tickets tickets"
  "stage actions"
  "carousel carousel"
  ```
  - The stage is wide (about 2fr), the actions column 1fr.
  - **Keep from today:** the `.house`, the curtains, `data-place` and `data-feeling`.
  - **Remove:** the pill styles (`.choose`, `.talk`, `.makeIt`, `.partLabel`, `.prop*`).

  **Portrait grid areas:**
  ```
  "ai"
  "question"
  "tickets"
  "stage"
  "carousel"
  "actions"
  ```
  - Tickets in one row with pictures only (`showLabel={false}`).
  - The stage at 4:3.

  **Everywhere:** no element inside the room overflows the viewport, and everything stays clear of the dock (`--dock-space`).

- [ ] **Step 6: Run** the typecheck, lint and `npx playwright test tests/e2e/m6-stories.spec.ts -g workshop`. Expected: the existing workshop test passes (it uses `slot-*`, `choice-picker`, `choose-this` and `make-it`).

- [ ] **Step 7: Screenshots.** Take `/stories/make`, empty and full, at 1180×820 and 390×844, in en and ar, and fix anything clipped or overlapping.

- [ ] **Step 8: Commit.**

---

### Task 7: The library (`Shelf`)

**Files:**
- Modify: `app/child/stories/Shelf.tsx`, `app/child/stories/stories.module.css`, `app/child/stories/page.tsx`

**Interfaces:**
- `Shelf` props become `{ books, makeState: "ready" | "resting", line }`.
- `page.tsx` passes `"resting"` when the refusal is `daily_cap` or `off`. For any other refusal, the page already shows `TimeUp` or isn't reachable.
- `canMake` is removed.
- Test ids `make-story` and `book` stay.

**Steps:**

- [ ] **Step 1: Re-lay out `Shelf.tsx`.**
  - **The library scene** stays (`Library`).
  - **The caption** stays.
  - **The reading table** (start side): `<ActionObject art="ui_btn_make_story" label={t("makeNew")} href="/stories/make" resting={makeState === "resting"} sizes="22vmin" testId="make-story" />`. When resting it renders a `<button>`, not a link, that sets the caption to the refusal line (passed in as `line`). Feelio (`STORY_ART.reader`) sits beside it.
  - **The shelves** (end side): heading `t("myBooks")`, then the books.
    - **A book** stays a link with its cover.
    - **The ribbon:** a ribbon corner (CSS `clip-path` triangle in rose) replaces the "New" pill. `aria-label` = the title plus `t("newBook")` when new.
    - **Tapping a book:** `motion.a` with `whileTap={{ scale: 0.95 }}`, and a 150 ms delay before navigating, so the slide-out shows. Calm: navigate at once.
  - **No books:** the shelves show three empty plank rows, and the caption is `t("firstStory")` with audio `stories_firstStory`.

- [ ] **Step 2: Rewrite `stories.module.css`.**
  - **Landscape:** two areas, the table (0.8fr) and the shelves (1.4fr).
  - **Portrait:** the table row on top (object plus Feelio side by side), then shelves of 2 columns.
  - **Keep:** the planks (D-071) and the cover tones.
  - **Remove:** the `.magic` pill.

- [ ] **Step 3: Run** the typecheck, lint and the m6 storybook tests (they open a book from the shelf). Take screenshots and fix.

- [ ] **Step 4: Commit.**

---

### Task 8: The storybook (`Reader`)

**Files:**
- Modify: `app/child/stories/[id]/Reader.tsx`, `app/child/stories/[id]/reader.module.css`

**Interfaces:**
- Test ids that stay: `book-wrap`, `open-book`, `next-page`, `read-to-me`, `page-<n>`.
- New test ids: `prev-page`, `bookmark-<n>`, `answer-<k>`.

**Steps:**

- [ ] **Step 1: Back to the library.** It becomes `<Pressable shape="round" href="/stories" label={t("home")} icon={<Home …/>} className={styles.back} />`.

- [ ] **Step 2: The page arrows** become `<Pressable shape="round" tone="plain">` page corners, positioned on the book's outer edges (`inset-inline-start/end: -24px`):
  - **Disabled:** at the first and last page (via `disabled`, which renders sunk).
  - **Test ids:** `prev-page`, `next-page`.

- [ ] **Step 3: Bookmark tabs.** A `<nav aria-label={t("pageOf",…)}>` on the book's top edge with 6 tabs (cover, 1–4, the end).
  - **Each tab:** a `<button>` 72 px tall, mostly hidden behind the book edge, with `aria-current="page"` on the current one (sticks out further) and `aria-label={t("bookmark",{n})}`.
  - **Tapping a tab** jumps to that page, without a turn animation when it's more than one away; a fade.
  - **The star row** (`.stars`) goes.

- [ ] **Step 4: The cover.** The open button becomes `<Pressable tone="primary" label={t("openBook")} icon={<BookOpen/>} testId="open-book" onPress={() => go(1)} />`.

- [ ] **Step 5: `ReadToMe`.** It becomes `<ActionObject art="ui_btn_read_aloud" label={state === "playing" ? t("stop") : t("readAloud")} ready={state === "playing"} loading={state === "loading"} onPress={toggle} sizes="96px" testId="read-to-me" />`. Keep its states and the "refused → hidden" rule.

- [ ] **Step 6: The end page.**
  - **The answers:** `<button>`s, each wrapping a `<ChoiceDisc word={a} selected={answer===k} size="sm" />`, with `data-testid={"answer-"+k}`.
  - **"Make another":** `<ActionObject art="ui_btn_make_story" label={t("another")} href="/stories/make" sizes="14vmin" />`.
  - **"Back to my books":** `<Pressable label={t("home")} href="/stories" icon={<Home/>} />`.

- [ ] **Step 7: The CSS.** Update `reader.module.css`: remove `.arrow`, `.open`, `.readToMe`, `.answer` and `.endLink`; add `.corner`, `.bookmarks` and `.tab`.

- [ ] **Step 8: Run** the typecheck, lint and the m6 storybook tests. Take screenshots (spread and phone, en and ar) and fix.

- [ ] **Step 9: Commit.**

---

### Task 9: End-to-end tests (touch, mouse, keyboard, layout) and docs

**Files:**
- Create: `tests/e2e/m8-story-experience.spec.ts`
- Modify: `docs/DECISIONS.md` (D-075), `docs/PLAN.md`, `docs/PLACEHOLDERS.md` (nothing open), `docs/REDESIGN_V2.md` (the Story rows point to D-075)

**Steps:**

- [ ] **Step 1: The test file.** Use the m7 helpers (`fixture`, `asChild`, `overlap`).

  **Theatre by touch:** `test.use({ hasTouch: true, isMobile: true, viewport: 390×844 })`.
  - Go to `/stories/make`.
  - Hero ticket: `toHaveAttribute("aria-current","step")`.
  - **Drag:** drag the track left with `page.touchscreen.tap` points / `dispatchEvent` pointer sequence: `pointerdown` at the centre, `pointermove`, `pointerup` 100 px left. The middle changes and nothing is picked: the hero ticket is still current.
  - `tap()` a side slide: it becomes the middle, still nothing picked.
  - `tap()` the middle: the hero ticket gets `data-selected` and the place ticket becomes current.
  - Pick place, feeling and adventure by tapping the middle each time.
  - `make-it` is visible.
  - Tap `slot-hero`: the hero is the current step again.
  - **No story is created:** the test never taps `make-it`, same rule as m6.

  **Theatre by mouse** (1180×820):
  - Pick each step with a `click` on the arrow pressables, then a click on `choose-this`.
  - Assert `make-it` has `data-ready`.

  **Theatre by keyboard:**
  - Focus the track (`choice-picker` → the track).
  - `ArrowRight`, then `Enter` picks.
  - The focus is still inside `choice-picker` after the pick, on the next step.
  - Then 3 × `Enter`, and `make-it` appears.

  **Theatre, double tap:** stub creation with `page.route("**/api/child/stories", …)`, answering `{ id: "…" }` once with a 1 s delay only for `{action:"create"}` bodies (other actions pass through). Double-click `make-it` and assert one create request.

  **Library:**
  - **No books:** the caption contains "very first story".
  - **One book:** `book` visible, with the ribbon; a tap opens the reader.
  - **Daily cap** (fixture `storyCount: 3`, made today): `make-story` has `data-resting`, and tapping it says the cap line.

  **Storybook:**
  - `bookmark-3` jumps to page 3.
  - `prev-page` and `next-page` by tap and by keyboard ←/→.
  - **End page:** `answer-0` gets selected.
  - **Arabic:** `next-page` sits on the inline start side, so its box is to the left of the book centre.

  **Reduced motion:** `page.emulateMedia({ reducedMotion: "reduce" })` and pick one step. No errors.

  **Layout:** for `/stories`, `/stories/make` and a book, at 1180×820, 1920×920 and 390×844 in en and ar:
  - collect `[data-testid]` elements that are visible controls (tickets, `make-it`, `story-voice`, `choice-picker`, `make-story`, books, `prev-page`, `next-page`, `read-to-me`) plus the dock items
  - assert no two overlap, and each is inside the viewport

- [ ] **Step 2: Run** `npx playwright test` (all). Expected: everything passes. Fix the layout, never the test, when an overlap shows.

- [ ] **Step 3: Write D-075** (the decisions, the button system, what was verified by running it), and update `PLAN.md` and `PLACEHOLDERS.md`.

- [ ] **Step 4: Commit.**
