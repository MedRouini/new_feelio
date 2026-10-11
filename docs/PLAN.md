# Plan and milestone status

## Status
| Milestone | Status |
|---|---|
| 0 Discovery and plan | Done; owner said "go" (2026-10-10) |
| **1 Foundation** | **Done (2026-10-10)**, see below |
| **1b Map, mascot shell, character onboarding** | **Code-complete (2026-10-10). Done when the 38 visible placeholder assets are delivered** (docs/PLACEHOLDERS.md) |
| **1c Level flow and loading** (owner request) | **Code-complete (2026-10-11).** Place maps, level states, progress and unlocking, artifact architecture, loading system. Done when the Batch 3 P1 assets are delivered and Home's stones are measured (docs/LEVEL_FLOW.md) |
| **2 Safety layer + voice-proxy spike** | **Built and tested (2026-10-11).** Live ElevenLabs call skipped by the owner (D-061). Model choice done (D-063: strict median 1.65 s to first words). Strict or gated is decided in Milestone 5, with end-to-end voice timings. Expert review deferred by the owner while in development |
| **3 Parent dashboard** | **Done (2026-10-11).** Child page (time, week, progress, safety notes), allowed hours and time zones (Luxon), safety-lead review, parent reports, guide (D-065, D-066) |

## Milestone 3 (parent dashboard): result
**Built** (D-065, D-066):
- Time zones with Luxon, allowed hours and the family's own day, all enforced on the server. The child sees Feelio resting.
- The child's page: today, the week, progress and gentle safety notes (restricted events never shown).
- "Something felt wrong?" reports. The safety lead's review screen (owner only, fresh password check). The "How Feelio works" guide.
- The Talk button follows the parent's setting. The Adventures switch.
- Dropped by the owner: "reset a child's progress".

### Verified by running it (2026-10-11)
- **Lint, typecheck, 107 unit and integration tests, and the red team** (rules only, no regressions).
- **Integration:**
  - allowed hours in the family's zone
  - no time counted outside hours
  - 23:30 UTC counted on Dubai's next day
  - invalid windows never saved
  - time zone validated and audited
  - the overview hides restricted events
  - reports redacted and in the queue
  - the safety-lead id list
- **End to end, 19/19,** including 3 new tests:
  - the child page and the report
  - settings with the time zone shown, and a refused empty schedule
  - outside hours: the child's resting screen, the API refusing (403), the parent seeing why
  - the guide, the time-zone change, and `/safety` answering 404 for a non-lead
- **Screenshots reviewed:** child page, settings, child resting screen, guide.

### Only written, not run
- The safety-lead screen with real events: it is integration-tested, but not opened in a browser as the owner. The owner can open it from the dashboard header.

## Milestone 2 (safety layer + test suite + voice-proxy spike): result
**Built** (`safety/`, `content/safety/`; decisions D-058 to D-062):
- **The pipeline:**
  - T0 rules in English, Arabic and Arabizi
  - T1 classifier (Together, JSON schema, fails closed)
  - a reviewed routing table, crisis scripts, redirect lines, fallbacks and steer notes
  - the child-safety system prompt
  - sentence-by-sentence output checks (strict by default)
  - personal-information redaction
- **Safety events:** minimal and restricted where needed; encrypted excerpts; anonymous counts; retention as approved (D-058).
- **Crisis resources:** baseline wording with no numbers until markets are chosen (D-059).
- **Red-team suite:** 765 cases plus 26 output sentences. `npm run redteam` (rules only, free, in CI) and `npm run redteam -- --full` (with the classifier, about $0.10).
- **Voice proxy spike:** `/api/voice/llm`, adult-only and switched off by default. Latency script: `scripts/voice-latency.ts`.
- **`docs/REPORTING_PROCEDURE.md`** (draft, needs counsel).

### Verified by running it (2026-10-11)
- **Red team, rules only:** all must-catch cases caught; 0 false alarms.
- **Red team, rules plus classifier:**
  - serious cases 399/399
  - benign 148/148 (0 false alarms)
  - steers 123/124
  - outputs 26/26
- **Unit tests:** pipeline behaviour with a fake model:
  - a crisis never waits for a model
  - words are held until the verdict
  - unsafe sentences are swapped
  - fail closed
  - a broken stream is not said
  - personal information never reaches the model
- **Integration tests on Neon:**
  - restricted events are hidden from the parent
  - excerpts are encrypted and redacted
  - counts
  - retention, including escalated events kept
  - cascade on account deletion
- **The proxy over HTTP:** 401 without the secret; the agent's own system prompt is ignored; crisis scripts in about 0.2 s; English and Arabic turns.
- **Latency measured:** strict median 1.9 s, gated 1.1 s, to first checked words (D-062).
- **End to end:** 16/16. A first run on a freshly restarted dev server timed out on 8 tests while pages were still compiling. All 16 passed on the warm server (3.6 min), and the failing test passed on its own. Dev-server cold start, not a code fault; worth knowing if CI ever runs the end-to-end tests against `next dev`.
- **Lint, typecheck, 92 unit and integration tests:** all pass.

### Only written, not run
- A live ElevenLabs agent call (skipped by the owner).
- Image checks (stories, Milestone 6).
- The post-call transcript webhook (Milestone 5).

### Bugs found by testing (worth knowing)
- **Typos and role-play:** they slipped past the first classifier prompt. Fixed in `t1-v0.2`.
- **Honest AI disclosures:** the output reviewer blocked "I'm not a real person, I'm Feelio, a friendly AI". Fixed in `t1-v0.3`, and now covered by output tests.
- **Classifier time-outs:** under load they fell back to a change of subject. They now give a gentle check-in line, after one retry.
- **Broken streams:** a stream that broke mid-sentence released the half sentence. Now dropped.
- **Host routing:** it answered 404 for the new voice route. `/api/voice/` is now allowed on any host, because the route checks its own secret.

## Milestone 1c (level flow and loading, D-056, D-057): result
**Built** (details in `docs/LEVEL_FLOW.md`):
- World map → place map → level → celebration → next level, with the server deciding every state.
- Four level states: locked, available, in progress, completed.
- Artifacts plug into levels through a catalog. None exist yet, so levels say "still being made". A labelled developer test stands in, in development only.
- One loading system (scene, transition, route loading, timing, retry) used by every new screen and route.
- Asset slots: art references are configuration. Batch 3 has 43 asset requests (11 are P1).

### Verified by running it (2026-10-11)
- Lint, typecheck, and 67 unit and integration tests, including progress on Neon with synthetic data.
- **End to end:**
  - the full Home journey in English (landscape)
  - Arabic portrait
  - refusals by address and by API
  - the earlier map, dock and onboarding tests
- Screenshots reviewed: loading iris, place map (EN landscape, AR portrait), developer test, celebration (EN landscape, AR portrait).
- Migration `0002_progress_status` applied to the dev database.

### Only written, not run
- The place maps with real art (not delivered). The stones' layout is provisional.
- The slow and problem phases in a real slow network (the problem screen was seen once, when the dev server served a stale module).
- A production build with this milestone.

## Milestone 1b (map + mascot shell + character onboarding): result
**Built (all in the DESIGN_SYSTEM direction: scenes, objects, mascot-led, no panels or shadows):**
- **Onboarding**, "Arriving in Feelio's world", 5 stops, EN and AR, landscape and portrait, skippable and resumable:
  1. The AI disclosure on a sign and in Feelio's words.
  2. The character: shape, paint-pot colour, companion, and a name from a list or the parent's nickname.
  3. Likes (up to 3).
  4. A local-only microphone test, shown only if Talk is on.
  5. The gate, then the first map moment: walking to Home.
- **Map:**
  - Both orientations, and the Arabic map in Arabic.
  - Pan, pinch, wheel and double-tap zoom.
  - Places as real buttons over the art. "Not yet" mist and lock, a ring under the current place, a star when finished.
  - The whole map always fits the screen above the dock, and the ring is fitted to each stone's measured oval (D-054). **Verified by running it:** E2E at 8 screen sizes.
  - The mascot and the child's character walk the path. Tapping a place zooms in and shows its level stones.
- **The rest of the shell:**
  - The dock as a glass bar over the world with five buttons and the Map as the larger centre button (D-055). The horizontal map is used from tablet width up. **Verified by running it:** E2E at 9 screen sizes, EN and AR. Waiting on `dock_calm` art.
  - The press-and-hold grown-up door.
  - My collection (the character, companion and name). Talk and Stories show honest "coming soon" screens.
  - The time-up goodbye; the offline screen and service worker; the PWA manifest and icons.
  - UI sounds (Kenney CC0).
- **Parent side:**
  - The Settings step (Talk, Stories, time per day, sound), so setup now reads: consent, child, settings, hand over.
  - Time per day is **enforced on the server** through heartbeats (D-045). The Stories switch is enforced too (D-046).
- **Data and tools:**
  - World data: `content/worlds/base/world.json`, its schema, the unlock engine, path geometry, and the pack registry (no-code packs).
  - Dev-only hotspot editor (`/dev/editor`; 404 in production, verified).
  - Voice-line generator with a cost guard (`safety/voice-lines`). Not run: it needs your voice choice.

### Verified by running it (2026-10-10)
- `npm run lint` and `npm run typecheck`: clean.
- `npm test`: **55/55**:
  - World data, unlock engine, geometry and onboarding validation.
  - Integration on Neon:
    - onboarding writes only to its own child, and resumes
    - the step never goes backwards; skip works
    - parent settings are what the child sees
    - heartbeats are rate-limited, and the daily limit stops counting and flips to time-up
- `npm run test:e2e`: **12/12** in Chromium:
  - Onboarding completed in **EN and AR × tablet landscape and phone portrait**, then the map with the chosen avatar, then My collection with the chosen name.
  - Resume after a reload works.
  - The map: 5 places, a locked "not yet", the place view with 5 stones, rotation switching maps without losing state, the RTL dock order, and the stage never mirrored.
  - Skip, the time limit, Stories off, child APIs refusing bad input or other origins, the editor.
  - Milestone 1 flows still pass with the new steps.
- `next build` + `next start`: the editor returns 404 in production; the manifest, service worker, icons and sounds are served; the internal `/child` and `/parent` paths are unreachable.
- Page weight on the production build, compressed:
  - map: JS 210 KB, images 222 KB, fonts 118 KB, total ≈ 570 KB
  - JS is **over the 150 KB budget** (D-052)
- Screenshots reviewed at 1180×820 and 390×844 in EN and AR. Critique and fixes are in DESIGN_SYSTEM §9.

### Only written, not run
- The service worker's offline behaviour: registered in production only, and not exercised offline in a test yet.
- The voice-line generator with `--yes`: no credits spent.
- Real-device checks (iPad Safari, Android Chrome).

## Milestone 1 (Foundation): result
**Built:**
- Next.js 16.4 app, one deployment with two hosts: child app and parent dashboard (D-032)
- Design tokens and shared components, English and Arabic with RTL
- Better Auth parent accounts plus the adult gate (password re-check)
- Consent before any child data; child profiles with an encrypted optional nickname
- Child device keys with a safe hand-off (D-033)
- Neon Postgres schema and migrations (Frankfurt)
- Daily retention job; hard deletion of a child or a whole account
- Safety import-boundary lint rule; asset pipeline; CI workflow
- `.env.example`, README, `PRIVACY.md`, `LEGAL_NOTES.md` (draft)

### Verified by running it (2026-10-10)
- `npm run lint`: clean. The provider-boundary rule was proven to fire on a probe file outside `safety/` and to stay silent inside it.
- `npm run typecheck`: clean.
- `npm test`: **32/32**.
  - Unit: host routing, encryption, i18n key parity, Arabic coverage, market config.
  - Integration against the real Neon database with synthetic accounts:
    - a child key is never a parent session (header or cookie)
    - a parent session is never a child key
    - keys are hashed at rest and bound to one child and household
    - households are isolated from each other
    - revoked or deleted keys stop working
    - consent is required before a child profile
    - the adult-gate windows (30 / 5 min) hold
    - child and account deletion cascade, including keys
    - retention deletes old rows and keeps recent ones
  - The database is back to 0 rows after the run.
- `npm run test:e2e`: **2/2** in Chromium against the dev server:
  - the "ask a grown-up" screen with the AI chip
  - parent surfaces 404 on the child host, child APIs 404 on the dashboard host
  - sign-up → consent → add child (Arabic) → device setup
  - the child home renders in Arabic with `dir=rtl`
  - the device cookie is httpOnly and host-only
  - a child key gets 401 on the parent API
  - the parent is signed out on the child's device
  - sign-in → account deletion → the child key dies
  - a wrong password keeps the gate closed
- `npm run build`: production build succeeds (Turbopack).
- Screenshots reviewed: child home (EN not-set-up, AR home), sign-in, consent, child detail, gate.

### Only written, not run
- `.github/workflows/ci.yml`: there is no GitHub remote, so CI has never run.
- `vercel.json` (region `fra1`, daily cron): not deployed. No Vercel project exists.
- The retention cron route was exercised through its function (integration test), not through Vercel Cron.
- Email verification code path: off. No email provider is chosen (see Still open).

### Bugs found and fixed through testing (worth knowing)
1. A parent server-action redirect rendered the child page (Next renders redirects in-process). Fixed with internal prefixes for both surfaces and `x-forwarded-host` routing (D-032).
2. `Referrer-Policy: same-origin` made the device hand-off send `Origin: null`, and the origin check correctly refused it. The policy is now `strict-origin-when-cross-origin` (D-033).
3. `decryptField` rejected an empty string.
4. Failed E2E runs left synthetic accounts behind. Playwright now has a global teardown that removes them.

### Child-safety review (Milestone 1)
Result: **PASS**, with model-related items N/A because no model is called yet.
- **Model access:** no provider SDKs or hosts outside `safety/`. Only the optional key names are declared in `platform/env.ts`.
- **Enforcement:** child and parent scopes and every M1 setting are enforced on the server and proven by tests. Nothing trusts client values.
- **Secrets:** none in the code. `.env` is git-ignored. All 11 variables are in `.env.example`.
- **No fakes:** `docs/PLACEHOLDERS.md` has no open entries.
- **Claims:** no compliance wording. The consent text is marked as a lawyer-unreviewed draft.
- **Data:** minimal fields, nickname encrypted, keys hashed, retention and deletion paths implemented, no content logging, synthetic data only.
- **Attack surface:** no uploads, messaging or sharing.
- **Brand:** only approved assets, nothing drawn, no mirroring, no emoji.

### RTL and i18n check
Result: **PASS**.
- EN and AR keys match (74 strings), with Arabic text everywhere except brand and language labels.
- Logical CSS only.
- `lang` and `dir` are set per locale.
- Arabic font: Baloo Bhaijaan 2.
- No mirroring of images.
- Minor: the device hand-off page's fallback "Continue" button is English only, and it shows for a split second at most.



## Milestone 0 outputs
- `brand/BRAND.md` (DRAFT v2: verified against files, gaps filled, every statement tagged [P], [F] or [I])
- `docs/ASSET_REQUESTS.md` (Batch 1, 30 entries in priority order)
- `docs/ARCHITECTURE.md` (modules, Mermaid diagram, voice gate and proxy, map and `world.json`, PWA, mascot state machine, auth, data model, degradation, threat model, scenario schema and migration, credentials)
- `docs/SAFETY_POLICY.md` (draft: traced requirements, pipeline, latency trade-off, abuse-disclosure protocol)
- `docs/BUDGET.md`, `docs/DECISIONS.md` (D-001 to D-017), `docs/TOOLS.md`
- `docs/safety/` (saved Anthropic documents and Anthropic's child-safety principles)
- `.claude/skills/` (`child-safety-review`, `asset-request`, `rtl-i18n-check`), `.mcp.json` (Playwright MCP 0.0.83)

### Verified by running something
- **Brand palette:** read the vector fill colours out of the brand PDF (PyMuPDF). All 8 palette hex values match exactly.
- **Brand SVGs:** extracted colours and gradient stops. Found the amber logo variant uses `#FFB703`, with an inconsistent heart colour.
- **Contrast:** computed the WCAG ratio for every text and background pair.
- **Images:** checked every PNG's dimensions and alpha. The official mascot's alpha touches the right edge.
- **Viewed:** every brand image, the full presentation, and both maps with a measurement grid. Hotspot, pad, sign and path positions were measured by eye on that grid (±0.02).
- **Provider facts:** read today on the official pages by research agents. I re-checked the two most decisive ones myself with `curl`: Together's "no moderation models offered via serverless", and the ElevenLabs under-18 clause.
- **Playwright MCP 0.0.83:** metadata confirmed on npm.

### Only written, not run
- Everything in ARCHITECTURE, SAFETY_POLICY and BUDGET is design. Latency, Arabic quality, classifier recall and credits per minute are **estimates until M2 and M4 measure them**.
- Playwright MCP is configured but not yet started: no app exists, and Claude Code asks you to approve project MCP servers the first time.
- **Lint, typecheck, tests:** not applicable. There is no code in Milestone 0.

## Milestone review: proposed order (changes to SPEC §9)
| # | Milestone | Change and reason |
|---|---|---|
| 0 | Discovery and plan | Done |
| **P** | **Owner track (starts now, runs in parallel)** | **New.** Before any real child uses the product: ElevenLabs written approval (D-005), Together confirmation and DPA (D-009), font licences (D-011), counsel review of LEGAL_NOTES, a safeguarding expert for SAFETY_POLICY §5, and Batch 1 assets |
| 1 | Foundation | Unchanged. Add `docs/LEGAL_NOTES.md`, `docs/PRIVACY.md` drafts, and next-devtools-mcp |
| 1b | Global map and mascot shell | Unchanged (needs Batch 1 P1 assets, otherwise it can't close without placeholders). *Stop for review* |
| 2 | Safety layer + test suite **+ voice-proxy spike** | **Add a thin, adult-only spike** of the ElevenLabs custom LLM → our proxy → Together, with no UI. It answers the open questions (client tools from the proxy, the conversation-id header, latency budget, first-token timeout) before M3 and M4 build on them. *Stop for review* |
| 3 | Parent dashboard | Unchanged (the session gate depends on settings) |
| **4** | **Scenarios and games** (was 6) | **Moved earlier.** Authored content uses no generative credits, isn't blocked by provider approvals, and gives the map shell its playable levels, so the core loop is real sooner. Migrates the legacy artifacts once they're delivered (the folder is empty today) |
| **5** | **Companion: text first, then voice** (was 4) | Text companion (L2) first: same safety pipeline, works without ElevenLabs approval. Then voice (session gate, proxy, agent as code, crisis handling). Real-child voice stays behind the D-005 approval flag. *Stop for review* |
| 6 | Storybook generator (was 5) | After scenarios. Depends on D-015 (characters) and the image-model evaluation |
| 7 | Hardening | Unchanged. *Final review* |

Review stops (SPEC: after 0, 1b, 2, 4 and the end) follow the content: after 0, 1b, 2, **5 (voice)**, and the end.

## Owner answers (2026-10-10)
| Q | Answer | Recorded in |
|---|---|---|
| 1 ElevenLabs approval | Adult-only voice testing until approval | D-005 |
| 2 Abuse-disclosure rule | Accepted. No expert or counsel available yet | D-019 (pilot gate below) |
| 3 Latency vs safety | Not clear in the question. **Resolved by the priority order: strict checking for every age**, revisited only with measured numbers | D-018 |
| 4 ElevenLabs credits | 120k **per month** | D-020, BUDGET §1 |
| 5 Together credits | About $50 | D-020, BUDGET §2 |
| 6 Classifier | "Anything that keeps the voice agent configurable and safe for children": LLM classifier behind a pluggable, configuration-driven interface | D-008, D-022 |
| 7 Map | Owner generates Arabic-sign versions in ChatGPT. English keeps the originals. No map mirroring | D-021 (replaces D-006) |
| 8 Story characters | Animals or creatures, **and Feelio** (composited from approved poses, never generated) | D-015, D-024 |
| 9 Fonts | Free fonts for now: Balsamiq Sans + Baloo Bhaijaan 2 (both OFL) | D-023 |
| 10 Auth and DB | Better Auth + Neon approved | D-002, D-014 |
| 12 Together docs MCP | Installed | TOOLS.md |
| 13 Legacy scenarios | None yet. Prepare the base (schema, validator, migration script) without them | D-026 |
| 14 Scripts | No preference beyond "no trouble on Vercel": TypeScript (same toolchain as the app; Vercel never runs these scripts) | D-025 |

## Pilot gate: all must be true before any real child uses Feelio
- [ ] ElevenLabs written approval for an under-18 product (D-005). Until then, children get the text companion only
- [ ] One qualified review of SAFETY_POLICY §5 and the crisis scripts (free options in D-019)
- [ ] DPAs and paid plans: Vercel Pro, Neon, Together (+ written OK for children's data), ElevenLabs (D-009, D-010)
- [ ] Counsel review of `docs/LEGAL_NOTES.md` and the consent form (CR-5)
- [ ] Red-team suite passing with 100% recall on high-severity categories (SR-17)
- [ ] **Verifiable parental consent method** chosen per market and built. The M1 method (`account_reauth_checkbox`) is not one of the methods the COPPA Rule lists (§312.5(b)(2)); see `docs/LEGAL_NOTES.md`
- [ ] Data export and withdraw-consent built in the dashboard (M3). The consent text says they are coming
- [ ] Written information-security program and a published data-retention policy (amended COPPA Rule §312.8(b), §312.10; LEGAL_NOTES)
- [ ] A support contact address for parents (the consent text tells them to "contact us")

## Still open
0. **Email provider** for parent email verification and future safety notices: a new third-party service, so the owner chooses (e.g. Resend or Postmark). Until then `REQUIRE_EMAIL_VERIFICATION=false`.
0b. **The Arabic strings** (`messages/ar.json`) are my translation. A native speaker should review them before the pilot.
1. **Approve `brand/BRAND.md` v2**, including §7 voice and tone and §8 UI tokens. Not yet answered.
2. **Brand details** (BRAND.md §10): colourways (B1), amber logo hex (B2), tagline (B4), Arabic register: Modern Standard Arabic or a dialect (B6), mascot PNG re-export (B7).
3. **Retention periods and caps** (ARCHITECTURE §7, SAFETY_POLICY §7, BUDGET §1–2). Not answered. I'll use the proposed numbers as defaults in configuration unless you change them.
4. **Approve the architecture** (D-001 Next.js TypeScript, ARCHITECTURE.md) and the **milestone order** above. Your "go" for Milestone 1 counts as approval.
5. **Email provider** for parent sign-in codes: a new third-party service, asked in Milestone 1.
6. **Accounts when ready:** Neon (`DATABASE_URL`) and a Vercel project. Rename `global_horizental.png` whenever convenient.
7. On your ElevenLabs usage page: how many **agent minutes** it shows per month (tells us whether minutes and credits are one pool).
