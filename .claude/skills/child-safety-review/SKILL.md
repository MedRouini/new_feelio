---
name: child-safety-review
description: Feelio's child-safety checklist. Run it before every milestone commit, and whenever a change touches model calls, voice, stories, images, parent settings, auth, data storage, logging or child-facing copy. Produces a pass/fail report; any fail blocks the commit.
---

# Child-safety review (Feelio)

Run this **before every milestone commit** (CLAUDE.md workflow) and on any change in the areas above. Sources: `CLAUDE.md` non-negotiable rules (CR-1 to CR-12) and `docs/SAFETY_POLICY.md` (SR-xx). If the policy and this list disagree, the policy wins. Update this file whenever the policy changes.

## How to run
1. List the changed files (`git diff --name-only <base>...HEAD` plus untracked files).
2. Go through every section below. For each item write **PASS**, **FAIL** (with file:line and the fix), or **N/A** (with a one-line reason).
3. Run the automated checks that exist at this stage: lint, typecheck, unit tests, and the safety red-team suite (`safety/tests/redteam`, from Milestone 2 on). Paste the pass rates.
4. Output the report in the format at the bottom. **Any FAIL blocks the commit.** Do not weaken a check to make it pass. Stop and ask the owner instead (CLAUDE.md workflow).

## 1. Model access (CR-1, SR-10, SR-11)
- [ ] No feature code imports a provider SDK or calls a provider URL (Together, ElevenLabs server API, any image API). Grep: `together`, `api.together`, `elevenlabs`, `api.elevenlabs`, `fetch(` with an external host outside `safety/`.
- [ ] Every new model input or output (text, transcript, story text, image prompt, generated image, AI-drafted content) passes through `safety/`.
- [ ] The ElevenLabs agent config (`voice/agent_config.json`) points its custom LLM only at our proxy route, with `backup_llm_config` disabled and prompt/LLM overrides disabled.
- [ ] Every model call carries the age-band child-safety system prompt (SR-12).

## 2. Server-side enforcement (CR-2, SR-32)
- [ ] Every parental setting, time limit, schedule and feature permission touched by this change is checked on the server, including at voice-token issuance.
- [ ] A test proves that a direct API call cannot bypass it, and that a child token cannot call parent endpoints.
- [ ] Nothing relies on client-supplied values (dynamic variables, extra body, overrides) for age band, permissions or limits.

## 3. Secrets (CR-3)
- [ ] No secret in client bundles, logs, error messages, test fixtures or commits. Grep the diff for `KEY`, `SECRET`, `TOKEN`, `sk-`, `xi-api-key`, `Bearer`.
- [ ] Every new environment variable is in `.env.example` with a description. `.env` is not staged.

## 4. No fake functionality (CR-4)
- [ ] No mock data or stubbed integration is presented as working.
- [ ] Every placeholder is marked `TODO(PLACEHOLDER): <reason>` and listed in `docs/PLACEHOLDERS.md`. A milestone with open placeholders is not done.

## 5. Claims (CR-5)
- [ ] No "COPPA compliant", "GDPR compliant", "safe for kids", "certified" or similar. Wording is "designed to support <requirement>; requires legal review."

## 6. Data minimisation and retention (CR-6, SR-25, policy §7)
- [ ] Only data the feature needs is stored. No raw audio. No full transcripts.
- [ ] Every new data type has a retention period and a deletion path in the retention table.
- [ ] PII (names, addresses, schools, phone numbers, emails) is redacted before storage and logging.
- [ ] Logs contain no child content (only ids, categories and counts).
- [ ] Free-tier services receive synthetic or test data only.

## 7. Safety protocols (SR-60 to SR-67, SR-01 to SR-05)
- [ ] Crisis paths (self-harm, immediate danger, abuse disclosure, grooming or sextortion) use reviewed fixed scripts and static audio, and never model output.
- [ ] Crisis resources come from the per-locale reviewed data file.
- [ ] Abuse disclosure respects the actor rule: no parent notification when the actor is `household_caregiver` or `unknown` (policy §5).
- [ ] The companion never asks investigative questions and never promises secrecy.
- [ ] The mascot is `calm` or `empathy` during crisis moments, never `excited`.
- [ ] Story image prompts are template-built, never the child's raw words. The NSFW checker stays on. Generated images get a second check.
- [ ] New red-team cases were added for any new input surface, in EN and AR.

## 8. AI disclosure and companion boundaries (CR-8, SR-20 to SR-23)
- [ ] The AI chip ("I'm Feelio, a friendly AI") is visible on every Talk and Story screen touched, with audio, in both languages.
- [ ] No copy or prompt implies the companion is human, a secret friend, or the child's only friend.
- [ ] No diagnosis language.

## 9. No pressure (CR-12, MASCOT.md)
- [ ] No guilt lines, streaks, countdown pressure, "don't go" pleas, loot mechanics or leaderboards.
- [ ] No failure states: errors show the `confused` mascot and a retry, and are never the child's fault.
- [ ] Time-limit endings are warm (`waving` or `sleeping`), and the server ends them.

## 10. Attack surface (CR-9, SR-18)
- [ ] No user uploads of image, audio or video, no user-to-user messaging, no public sharing were added.

## 11. Cost discipline (CR-11)
- [ ] Every credit-spending path has a per-child daily cap and checks the global kill switch, and the degraded mode works (text only plus static audio).

## 12. Visual assets and brand (CR-7, CR-10)
- [ ] No hand-drawn SVG, canvas or CSS illustration, no emoji stand-ins, no redrawn mascot.
- [ ] Every image used is in `assets/approved/` or `brand/` and logged in `assets/manifest.json`. Missing assets are grey `TODO(PLACEHOLDER)` boxes.
- [ ] The mascot is never mirrored (also checked by `rtl-i18n-check`).

## Report format
```
## Child-safety review: <milestone / change> (<date>)
Result: PASS | FAIL (n items)
Automated: lint <ok/fail>, typecheck <ok/fail>, tests <x/y>, red-team <recall per category, FP rate>
| § | Item | Result | Evidence / fix |
|---|---|---|---|
...
Open risks for the owner: ...
```
