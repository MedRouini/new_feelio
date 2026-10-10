# Product Specification: Feelio

## 1. What we're building
A warm, trustworthy, emotionally intelligent companion platform for children aged 5–12, with a parent dashboard. It is not a chatbot with a children's theme and not a landing page. It is a cohesive, working product.

The product is a game-like world that children explore (see §4.1). Four features live inside it and share one safety layer and one design system:
1. Real-time voice companion
2. Four-page illustrated storybook generator
3. Interactive emotional scenarios and games
4. Parent dashboard and controls

**Launch markets:** not decided yet. Build market-agnostic: apply the strictest common baseline (verifiable parental consent before any child data is collected, data minimization, parental access and deletion, no behavioral advertising, no profiling for engagement) everywhere, and keep anything market-specific (consent method, crisis resources, legal text, age of digital consent) in per-market configuration so a market can be added without code changes. **Languages:** English and Arabic. Arabic means right-to-left layout, the ff yaseer typeface, and a voice agent that speaks Arabic; test every feature in both. The pilot is invite-only with consenting adult testers' children until markets are chosen; no public launch before then.

**Stage:** development and a small pilot with consenting testers. The resources below support that, not a public launch.

## 2. Inputs available
- `brand/`: logo, mascot assets, color palette, fonts and licenses, and a brand presentation. `brand/BRAND.md` is a DRAFT written from the presentation. Milestone 0 checks it against the real asset files, completes the gaps it lists, and I approve it before it guides any design decision.
- `legacy/artifacts/`: the source of the existing scenario prototypes built as Claude artifacts (see §4.3).
- `docs/safety/`: Anthropic's "Child safety guidance for developers" and "Responsible use of Anthropic's models: guidelines for organizations serving minors". Source URLs:
  - https://support.claude.com/en/articles/15591275-child-safety-guidance-for-developers
  - https://support.claude.com/en/articles/9307344-responsible-use-of-anthropic-s-models-guidelines-for-organizations-serving-minors

  Both documents are scoped to products built on Anthropic's API. We aren't using Claude in the product today, so they don't bind us directly, but we adopt them as our baseline standard. If Claude is added anywhere that children interact with it, treat both as binding.
- Resources: ElevenLabs credits (about 120k), Together AI credits, Vercel Hobby plan. **No Anthropic API key.** See `docs/PLAN.md` for which credentials are present in `.env`.

## 3. Stack and budget

### 3.1 Stack
[Edit freely. Delete a line if you want Claude to propose its own.]
- **Hosting:** Vercel Hobby. Our own code is serverless only: no WebSockets, no long-running workers. Stream responses and keep each request short.
- **Backend:** route handlers on Vercel. Either Next.js (TypeScript) route handlers or FastAPI as Vercel Python functions; recommend one in Milestone 0 and justify it.
- **Frontend:** Next.js with React and TypeScript (proposed), responsive (mobile, tablet, desktop).
- **Database:** free-tier Postgres (e.g. Neon or Supabase), synthetic data only until we're on plans with data-processing agreements.
- **LLM:** Together AI hosted open models. Pick separately for (a) live voice conversation (fast, low latency), (b) story writing, (c) offline scenario drafting. Evaluate on our red-team set in every supported language.
- **Safety classifier:** a Together-hosted safety model (e.g. a Llama Guard-class model; check what's currently available), plus rule-based checks and reviewed fixed scripts.
- **Voice:** ElevenLabs Agents (see §5.1). The agent is defined as code and synced by a script.
- **Image generation:** Together-hosted image models to evaluate (see §5.2).
- **Auth:** use a well-known, maintained authentication library or service; do not build authentication, password storage, or session handling ourselves. Claude Code proposes the option in Milestone 0 (candidates such as Auth.js, Better Auth, Clerk or Supabase Auth) and justifies it against: runs on Vercel Hobby, free-tier friendly, supports email plus password or passwordless and optional MFA, supports re-authentication for the adult gate, data location and data-processing terms, and lock-in. Only parents have accounts. Children never have credentials or email addresses; a child session is a scoped, short-lived token issued by our backend after a parent has authorized the device. Parent and child scopes are separate.

Propose alternatives only when there is a concrete reason. Record the reason in `DECISIONS.md`.

### 3.2 Budget rules
- The ElevenLabs credits are the scarcest resource. In Milestone 0, find out from the current pricing page and dashboard how many credits a voice minute actually costs (and whether the LLM cost is billed in credits or separately), and compute how many sessions the budget covers.
- Every credit-spending feature has a **per-child daily cap** and a **global kill switch** that degrades to text-only plus pre-recorded audio.
- A voice session has a **hard maximum duration** set in the agent config as a backstop to our own timer.
- **Fixed audio is static:** greetings, breathing exercises, "time's up" messages, and all crisis scripts are generated once, reviewed, and served as files.
- Keep spoken replies short (one or two sentences); credits scale with speech.
- Story narration is opt-in ("read to me"), not default.
- A developer-only usage report shows credits and tokens per session and per feature.

## 4. Design system
- Before making design decisions, audit `brand/` and summarize what it defines and what it leaves open.
- Build design tokens (color, type scale, spacing, radius, motion) from the brand, plus a small component library both apps share.
- **Child app:** warm, playful, safe, expressive. Large touch targets (≥ 48px), minimal reading load for younger kids, icons and audio cues alongside text, subtle motion that honors `prefers-reduced-motion`.
- **Parent dashboard:** calm, professional, trustworthy, plain language, and still recognizably the same brand.
- Accessibility: WCAG 2.2 AA contrast, keyboard navigation, screen-reader labels, and adjustable text size as a parent setting.
- Brand: use the tokens in `brand/BRAND.md` (palette, Balsamiq Sans for Latin text, ff yaseer for Arabic, Dreaming Outloud only for large display titles). Gradients are part of the brand on the mascot and a few hero moments; elsewhere keep surfaces flat and soft. Text must meet WCAG AA: use purple or dark navy for text, and keep amber, blue and rose for shapes, icons and large display text (see the contrast notes in `BRAND.md`).
- Avoid: generic AI dashboards, gradient-heavy UI chrome, stock imagery, any character that isn't our mascot or a character consistent with our art direction.

### 4.1 App shell and world
The child experience is a game world, built as a web app that feels like a native tablet app.
- **Shell:** installable PWA, tablet-first in landscape, also usable in portrait on phones and on desktop. Fullscreen, no page scrolling, large touch targets, safe-area aware, gesture-friendly. Arabic is right-to-left, so the whole shell must mirror correctly.
- **The global map (current scope):** the world is one illustrated global map showing the places (Home, School, Park, Market, Club; more can be added as data). The owner already has the map in two orientations: vertical (portrait) and horizontal (landscape), under `assets/approved/map/`. The map is made **interactive in code**: orientation-aware rendering, pan and zoom, a tappable hotspot per place, locked, current and completed states, a mascot marker that walks the path, and a place card that opens the place's levels. Full requirements are in `docs/MAP.md`.
- **Place levels (for now):** each place has about five levels, each with 2–3 scenarios, shown in a code-built place card (numbered nodes, locks, stars). Place-level maps and extra chapters come later as new assets (`docs/WORLD_PLAN.md`); do not build them now. Everything is data (`content/worlds/<pack>/world.json`: places, hotspot positions per orientation, path polylines, levels, unlock rules), not hard-coded.
- **Orientation and direction:** landscape uses the horizontal map, portrait the vertical one. Right-to-left languages mirror the UI and, if confirmed, the horizontal map (never the mascot).
- **Performance:** serve map images at viewport-appropriate sizes, lazy-load, and report page weight per screen.
- **Unlocking:** completing a level unlocks the next level, and enough levels unlock the next place. Progress is stored per child profile and checked by the backend. Children can replay anything already unlocked. No timers, no failure states, no pressure; rewards are gentle (collecting mascot moments).
- **Phone-style navigation:** a playful "phone" dock inside the world with a few big buttons: Map, Talk (voice companion), Stories, and My collection. Icons come with labels and audio cues. Settings and the parent area are never on the dock; they sit behind the adult gate.
- **Contextual companion:** the voice companion knows which place and scenario the child is in (passed as non-personal context when the session starts), so "Talk" in the Park can talk about the Park. Credit caps from §3.2 apply.
- **Performance:** serve images as WebP or AVIF, aim for 400 KB or less per scene, lazy-load, and cache with a service worker. Vercel Hobby has bandwidth limits, so measure and report page weight per screen.
- **Tech:** DOM, SVG and CSS with a light animation library. Don't introduce a game engine unless `DECISIONS.md` justifies it.

### 4.2 Visual assets: owner-generated, never drawn by Claude Code
Visuals are central. See `docs/ASSET_PROTOCOL.md` (the rule and the request format), `docs/MASCOT.md` (the mascot as a guide) and `docs/ART_DIRECTION.md` (style).
- **Claude Code does not draw or generate visual assets** (no SVG, canvas or CSS art, no emoji stand-ins). Whenever an asset is needed (a mascot pose, a dock icon, a badge, a place card, a background, a story frame, an empty state), Claude Code writes a ready-to-paste ChatGPT prompt in `docs/ASSET_REQUESTS.md`, batched per milestone, and says which reference images to upload. The owner generates a transparent PNG and drops it in `assets/approved/`.
- The mascot comes from the official file plus poses the owner generates from it with the standard prompt in `docs/MASCOT.md`.
- Claude Code checks each delivered asset (rejection list in the protocol), logs it in `assets/manifest.json`, wires it in, and asks for a redo with an adjusted prompt if needed.
- Placeholders are grey labelled boxes marked `TODO(PLACEHOLDER)`; a milestone with open placeholders is not done.
- Every map and place has alt text and an audio description.
- Supporting characters in scenarios come from a cast sheet requested and approved once, then reused.

### 4.3 Legacy scenario prototypes
The existing scenarios were built as Claude artifacts. I will put their source in `legacy/artifacts/`.
- Inventory them, then migrate the content (not the code) into structured files under `content/scenarios/`. Schema: `id`, `place`, `level`, `age_band`, `emotion_tags`, `situation`, `question`, `choices[]` (each with `text`, `feedback`, `consequence`), `reflection`, `asset_refs`, `review_status`.
- Every migrated scenario starts as `review_status: draft`. Only expert-reviewed scenarios ship.
- Write a migration report that lists what changed and what was dropped.

### 4.4 World packs: "Feelio visits ___" (design for it now, build it later)
The base world is culturally neutral so it works in every market. Later, Feelio can travel: each destination (a country or region) is a **world pack** with a few places and levels. Build only the base pack now, but make sure nothing in the code or data blocks packs later.
- **Data, not code:** a pack is a folder under `content/worlds/<pack-id>/` with `world.json` (places, checkpoints, levels, unlock rules), its scenarios, its assets, a pack style addendum for art, localized strings, and metadata: `id`, `name`, `region`, `languages`, `status` (draft, reviewed, live), `enabled_markets`, `reviewers`, `content_review_status`.
- **Loading:** the app discovers packs at build or run time; adding a pack requires no code change. A feature flag per pack and per market controls what is visible, and parents can switch destinations off.
- **Growth:** the base world grows by adding places and chapters as data and assets; a destination pack is a new chapter or its own map reached from a travel node, using the same renderer and the same asset protocol.
- **Travel in the shell:** the Map has a globe or "travel" entry that unlocks after the child completes enough base-world levels. A "passport" in My collection holds stamps or postcards earned per destination.
- **Learning angle:** destination levels teach through being a visitor: curiosity about differences, empathy, adapting to something new, feeling homesick, communicating across a language gap. They don't turn countries into stereotypes.
- **Quality rules:** each pack is written or reviewed by people from that region and by a child-development expert; no stereotypes, flags or religious symbols unless a local reviewer asks for them, no sacred sites. Safety-layer rules and crisis resources stay locale-driven, not pack-driven.
- **Languages and direction:** strings and voice-agent language are per pack and per child profile; the shell must handle left-to-right and right-to-left.
- **Cost:** every pack needs its own map assets (made by the owner in ChatGPT), possibly its own cast sheet, and review time. `docs/BUDGET.md` should estimate the effort per pack.

## 5. Features

### 5.1 Real-time voice companion
**Behavior**
- Speaks naturally and warmly, in short sentences suited to the child's age band.
- Notices emotional cues, helps the child name the feeling, asks one gentle follow-up at a time, and suggests simple healthy coping strategies (breathing, naming, movement, talking to a trusted adult).
- Has a consistent personality derived from `brand/BRAND.md`.

**Boundaries (enforced in the system prompt and checked by the safety layer)**
- Never claims or implies being human. If asked, answers honestly in kid-friendly words. The app also states visibly that the companion is an AI (see §6).
- Never diagnoses or labels mental-health conditions.
- Never presents itself as a replacement for parents, teachers, friends, or professionals, and never as the child's only support. It regularly points back to trusted adults.
- Never encourages dependency or secrecy ("don't tell your parents"), and never guilt-trips the child into staying.
- Ends sessions gracefully when screen-time limits are reached.

**Voice architecture**
- ElevenLabs runs the real-time loop: listening, turn-taking, interruption, speech. The browser connects to ElevenLabs directly; our API key never reaches the client.
- **Session gate:** the child app asks our backend for a short-lived session token or signed URL. The backend issues it only if the parent has enabled voice, the schedule allows it, the child's daily time and credit budget remain, and the global kill switch is off. This is the server-side enforcement point.
- **Safety proxy:** the agent is configured with a custom LLM pointing at a streaming route we own. That route (1) classifies the child's transcript, (2) forwards to the Together-hosted model with the age-specific system prompt, (3) checks the output sentence by sentence as it streams, and (4) swaps in a reviewed fallback line if a check fails. The extra hop adds latency, so keep the input check light and measure the effect.
- **Crisis handling:** when the safety layer detects a disclosure, self-harm, or danger, the response comes from a reviewed fixed script (static audio), and the app shows locale-specific resources on screen through a client tool.
- **Post-call:** a webhook receives the call summary or transcript, runs a second-pass classifier, and writes safety events to the parent dashboard. It never stores raw audio.
- The agent configuration lives in the repo (`voice/agent_config.json`) and is created or updated by `scripts/sync_voice_agent.py` through the ElevenLabs API. No manual dashboard-only settings.
- Check the current ElevenLabs documentation for exact endpoints, custom-LLM configuration, session overrides, guardrail options, and max-duration settings, and confirm that an OpenAI-compatible proxy works as expected before building on it.

**UX and technical**
- **Mascot-first Talk screen (like a video call with a friendly character):** the mascot is large in the centre and is the voice companion's body. Its pose follows the session state (idle, listening, thinking, speaking) and, through a client tool or emotion tags, the feeling of the conversation. A big microphone control, optional captions, a visible "I'm Feelio, a friendly AI" chip, and a clear end button. State machine, pose list and rules are in `docs/MASCOT.md`. All mascot images are delivered assets, never drawn by Claude Code.
- No pressure mechanics: no guilt notifications, no streak shaming, no pleas to keep talking.
- Clear visual states: idle, listening, thinking, speaking, interrupted, error, offline.
- Natural turn-taking, barge-in (the child can interrupt), and recovery from dropped connections.
- Explicit, child-understandable microphone permission flow, with parent consent captured beforehand.
- Latency target: under 2 s from end of speech to first audio (proposed; adjust after the Milestone 0 measurements). Measure it end to end, including the proxy hop, and report it.
- When voice is unavailable (budget, schedule, outage), degrade to a text chat with the same safety layer, not to a dead screen.
- Audio is not stored.

**Done when:** a real session works end-to-end on desktop Chrome, iOS Safari, and Android Chrome; interruption works; every boundary case in the safety test suite passes; the session gate and the max-duration backstop are proven by tests; and measured latency and credits per minute are documented.

### 5.2 Four-page storybook generator
- The child requests a story by text or voice (topic, feeling, or situation).
- Output: **exactly 4 pages**, each with short age-appropriate text and one illustration. This is validated by schema; a story that doesn't fit is regenerated or rejected, never padded.
- Structure: beginning → development → resolution. The story covers a real emotional situation (anger, fear, sadness, happiness, jealousy, friendship, empathy, confidence, disappointment, change) and handles feelings constructively without implying difficult feelings must vanish.
- The mascot appears where appropriate as an approved sticker or narrator composited by the app, never generated inside the story illustrations.
- An optional reflection question or simple activity follows each story.
- **Visual consistency:** generate a character sheet (text description + reference image) once per story and condition all 4 illustrations on it, along with a fixed style prompt derived from the brand. Evaluate 2–3 Together-hosted image models on consistency, safety filtering, latency, and cost per story, and record the results in `DECISIONS.md`.
- **Image safety:** characters are children, so the safety layer checks every image prompt and every generated image, and must block any sexualized depiction of a minor, any real person's likeness, and graphic content. No user-uploaded images anywhere in the product.
- The safety layer also checks the request and the story text.
- Narration is opt-in and uses ElevenLabs credits sparingly (see §3.2). Consider a pre-generated starter library of reviewed stories with cached audio.
- Story-screen UI (page frames, page-turn art, loading and empty states, buttons) are delivered assets requested through `docs/ASSET_PROTOCOL.md`. The four page illustrations are generated at run time through the safety layer.
- Generation shows a friendly progressive loading state. Pages appear as they finish.

**Done when:** 20 varied generated stories all have exactly 4 pages, pass the safety checks, and show visually consistent characters (judged by me from a review page you build).

### 5.3 Emotional scenarios and games
- Illustrated everyday scenarios: losing a game, nerves before school, arguing with a friend, being left out, helping someone who is sad, and more.
- Each scenario: situation → "How might [character] feel?" and/or "What could they do?" → 3–4 choices → supportive feedback explaining likely consequences. The child can explore every choice without shame or penalty.
- Teaches that people react differently and that more than one response can be okay.
- Difficulty bands by age, simple progression, and gentle rewards (e.g. collecting mascot moments) with no leaderboards, streak pressure, or loot mechanics.
- **Scenario content is authored and reviewed, not generated live.** Store it as structured content (JSON/DB) so an expert can review and edit it. AI may help draft scenarios offline.
- Scenarios live inside the world: each belongs to a level in a place (see §4.1) and is migrated from the legacy prototypes where possible (see §4.3).
- MVP slice (proposed): 2 places (Park and Home) × 3 levels × 2 scenarios = 12 scenarios across 3 age bands (5–6, 7–9, 10–12). School and Market, and everything else in §4.1, are added later as data. Adjust once the legacy prototypes are counted.

**Done when:** all scenarios are playable, every choice has feedback, and progress persists per child profile.

### 5.4 Parent dashboard
- **Adult verification** before access: parent account + re-authentication + an adult gate. Until markets are chosen, propose the strictest reasonable option in the plan, with per-market alternatives as configuration.
- **Manage:** child profiles, age band, language, accessibility settings, companion voice and interaction settings, feature on/off per child, daily screen-time limits, allowed schedules, content preferences, privacy settings, data export and deletion.
- **Insights:** high-level activity only (stories read and their themes, games completed, emotions explored). By default, no raw conversation transcripts. The exception is a safety event, which surfaces as a calm summary with recommended next steps. Explain this policy on the dashboard itself.
- **Transparency page:** in plain language, what is collected, why, where it is processed (list every subprocessor in use: ElevenLabs, Together AI, hosting, database, image provider, and Anthropic only if it is ever added), how long it is kept, and who can see it.
- **Safe-use guide:** a short plain-language resource for parents, and a child-friendly version in the app, on using the companion safely and what to do if something feels wrong.
- All settings are enforced server-side. Each one needs a test proving that a direct API call can't bypass it.

## 6. Safety layer (shared, built first)
Turn the documents in `docs/safety/` into a written policy (`docs/SAFETY_POLICY.md`), then implement it. Trace each requirement to its source document.

**Pipeline:** input classification → policy routing → generation with age-specific system prompts → output classification → response or safe fallback. It applies to voice transcripts, story text, image prompts, generated images, and any AI-drafted game content.

**Required protocols (each one needs a defined response, an escalation path, and tests):**
| Situation | Expected behavior |
|---|---|
| Harmful or dangerous requests | Calm redirection with no lecturing; offer an alternative activity |
| Sexual content | Never generated; neutral redirect; log a safety event |
| Sexualization of minors, grooming, sextortion | Hard block in every feature including image prompts and outputs; reviewed fixed response; log a safety event; follow the reporting procedure below |
| Violent or frightening content | Age-appropriate limits; no graphic detail |
| Abuse disclosure | Believe and reassure the child, encourage telling a trusted adult, give an age-appropriate helpline for their locale, notify the parent dashboard unless the parent may be the source (design this case carefully and flag it for expert review) |
| Self-harm or suicidal ideation | Take it seriously, stay warm, encourage contacting a trusted adult right away, show locale-specific crisis resources |
| Immediate danger | Tell the child to get an adult or call the local emergency number; show it on screen |
| Personal info (address, school, full name, phone) | Gently discourage sharing; redact before storage |
| Emotional dependency signals | Affirm the child's real-world relationships; reduce engagement hooks |
| Attempts to make it pretend to be human or "a secret friend" | Honest, kind refusal |

**Additional requirements drawn from the Anthropic guidance**
- **AI disclosure:** users are told, in child-friendly terms, that they are talking to an AI, at onboarding and visibly in the voice and story screens.
- **Moderation and monitoring:** content moderation on all inputs and outputs, and a monitoring process for safety events with a named owner and a review cadence.
- **Child-safety system prompt:** write a child-safety system prompt for every model call (and adopt Anthropic's published one if Claude is ever added).
- **Reporting procedure** (`docs/REPORTING_PROCEDURE.md`): what happens when apparent child sexual abuse material or exploitation is detected. US platforms with actual knowledge of apparent CSAM must report to NCMEC's CyberTipline; for other markets, identify the national hotline and legal duty (INHOPE keeps a directory). Do not retain or display the material beyond what the procedure requires; get counsel's review.
- **Safety by Design:** review the Thorn / All Tech Is Human "Safety by Design for Generative AI" principles and record how each phase (develop, deploy, maintain) is addressed.
- **Industry support:** note the Tech Coalition's Pathways program (free for startups) as a next step, and record any hash-matching or classifier vendor decisions.
- **Logging for transparency reporting:** keep aggregate counts of safety events by category, without storing child content beyond the safety-event retention period.

**Other rules**
- Crisis resources are configured per locale in a reviewed data file, not generated by the model.
- Safety events are stored with minimal data, visible to parents as described in §5.4, and have their own retention period.
- **Test suite:** a red-team set of child-style inputs (including misspellings, voice-transcription errors, and every supported language) with expected outcomes, run in CI. Report pass rates.

## 7. Privacy and security
- Separate parent and child authorization scopes. Children never see parent settings, and a child token can't call parent endpoints.
- Encryption in transit and at rest for personal data. Least-privilege database access.
- Retention table for every data type. Deletion is real (hard delete or crypto-shred) and cascades to providers where their API allows it.
- Verifiable parental consent before any child data collection, with the method chosen per market.
- Rate limits and cost caps per child and per household.
- Free-tier services get synthetic or test data only.

## 8. Legal and regulatory
Launch markets are not decided. In `docs/LEGAL_NOTES.md`, first document the strict common baseline we build to, then a short table of what each candidate market would add (and what extra work it needs), so I can choose markets with the cost in view. Candidate requirements to research, e.g. COPPA (US), GDPR Art. 8 and the age of digital consent per country (EU), the UK Age Appropriate Design Code, the EU AI Act transparency obligations, local data-protection law (for example Tunisia's, if it is a market; verify the current law), and the child-safety reporting duties in each market. Cite sources. List each requirement next to the feature that addresses it. Also check each provider's terms (Vercel Hobby's non-commercial limit, ElevenLabs, Together AI) for restrictions on children's data and commercial use.

This document is input for a lawyer, not a compliance statement. The Anthropic guidance asks organizations to comply with applicable child-safety and privacy law and to state this publicly; do not draft a public compliance statement until counsel has reviewed it.

## 9. Milestones (proposed order; refine in `PLAN.md`)
0. **Discovery and plan:** brand audit, architecture, provider verification (see the kickoff prompt), model evaluation plan, budget model, threat model, open questions. *Stop for approval.*
1. **Foundation:** repo, CI, design tokens and components, auth (parent/child), consent flow, database schema, `.env.example`.
1b. **Interactive global map and mascot shell:** with the owner's global map images (vertical and horizontal): PWA shell, orientation-aware interactive map (pan, zoom, hotspots, states), the dev-only hotspot editor, place card with code-built levels, phone-style dock, mascot marker. Uses delivered assets only; the first asset request batch (mascot Batch A, dock icons, lock/star/check badges) is written in `docs/ASSET_REQUESTS.md` in Milestone 0 so I can generate them in parallel. *Stop for my review.*
2. **Safety layer + test suite.**
3. **Parent dashboard** with server-side enforcement.
4. **Voice companion** (session gate, safety proxy, agent-as-code, crisis handling).
5. **Storybook generator.**
6. **Scenarios and games:** migrate the legacy prototypes, then add the remaining places with their assets.
7. **Hardening:** end-to-end tests, accessibility audit, performance, error states, deployment guide.

Stop for my review after milestones 0, 1b, 2, and 4, and at the end.

## 10. Deliverables
Working application, design system, integrations working where credentials exist, parent dashboard, `docs/ARCHITECTURE.md`, `docs/SAFETY_POLICY.md`, `docs/PRIVACY.md`, `docs/LEGAL_NOTES.md`, `docs/REPORTING_PROCEDURE.md`, `docs/BUDGET.md` (credits per feature and the caps), `docs/ART_DIRECTION.md`, `docs/ASSET_PROTOCOL.md`, `docs/ASSET_REQUESTS.md`, `docs/MASCOT.md`, `docs/MAP.md`, `assets/manifest.json`, `content/worlds/` (base pack) and its scenarios, `docs/PLACEHOLDERS.md` (empty at the end), tests (unit, integration, safety red-team, e2e), README with setup, environment variable reference, and a deployment guide.
