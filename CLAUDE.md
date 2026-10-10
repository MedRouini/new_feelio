# Feelio: Emotionally Intelligent AI Companion for Children

Ages 5–12. Users are children (child app) and parents (parent dashboard).

## Read before any work
- `docs/SPEC.md`: full product specification and the source of truth for scope.
- `docs/safety/`: saved copies of Anthropic's child-safety guidance and its guidelines for organizations serving minors. Treat them as the baseline standard for the whole product, including parts that don't use Claude. If Claude is ever added to the stack, they bind us directly.
- `brand/`: official brand assets, the brand presentation, and `brand/BRAND.md`. If `BRAND.md` is missing or marked DRAFT, derive a draft from the presentation and assets and get my approval before using it for design decisions. Never substitute, redraw, or "improve" the mascot.
- `docs/ASSET_PROTOCOL.md`: **visuals are central and Claude Code never draws them.** When you need any visual asset, write a ready-to-paste ChatGPT prompt in `docs/ASSET_REQUESTS.md` and I will generate it with a transparent background. Read this before building any screen.
- `docs/MASCOT.md`: the mascot as a Duolingo-style guide and the voice companion's body: roles, state machine, pose list and prompts.
- `docs/MAP.md`: the interactive global map (current scope: global map only, vertical and horizontal images already exist).
- `docs/ART_DIRECTION.md` and `docs/WORLD_PLAN.md`: style rules and the plan for future place maps and world chapters (not current scope).
- `docs/PLAN.md`: the current plan and milestone status. Update it at the end of every milestone.
- `docs/DECISIONS.md`: architecture and safety decisions, each with its reasoning. Add an entry for every non-trivial choice.

## Priority order (use it to settle conflicts)
Child safety > emotional usefulness > brand consistency > UX quality > number of features.

## Constraints that shape every decision
- **Hosting:** Vercel Hobby. No WebSockets or long-running processes in our own code. Functions have time limits, so stream responses and keep each request short. Hobby is non-commercial, so this setup is for development and a small pilot only.
- **Voice:** ElevenLabs Agents, about 120k credits total. Credits are scarce; see the budget rules in `docs/SPEC.md` §3.
- **LLMs:** Together AI credits. There is no Anthropic API key. Do not add one or any other paid provider without asking me.
- **Markets are undecided.** Build to the strictest common baseline and keep market-specific rules in configuration (SPEC §8). Don't hard-code a country.
- **Auth is not ours to build.** Use a well-known, maintained auth library or service (SPEC §3.1). Never write custom password storage, session, or token logic.
- **Languages:** English and Arabic, with full right-to-left support.
- **World content is data.** The base world is culturally neutral. Region-specific content only ever ships as a reviewed world pack (SPEC §4.4), never in the base. Don't hard-code places, levels, or scenarios.
- **Free tiers:** use synthetic or test data only on free tiers. Real child data waits for proper plans and data-processing agreements.

## Non-negotiable rules
1. **Shared safety layer.** All model inputs and outputs (text, voice transcripts, story text, image prompts, generated images, game content) go through `safety/`. Feature code never calls a model provider directly. The live voice loop is no exception: the ElevenLabs agent reaches the LLM only through our safety proxy route (see SPEC §5.1). Never point the agent straight at an LLM provider without asking me.
2. **Server-side enforcement.** Parental settings, screen-time limits, schedules, and feature permissions are enforced by the backend, including at voice-session token issuance. Hiding something in the UI does not count as enforcement.
3. **Secrets stay on the server.** They never appear in client bundles, logs, error messages, or commits. `.env.example` lists every variable with a description.
4. **No fake functionality.** Never present mock data or stubbed integrations as working. Any unavoidable placeholder is marked `TODO(PLACEHOLDER): <reason>` and listed in `docs/PLACEHOLDERS.md`. A milestone with open placeholders is not done.
5. **No compliance claims.** Never write "COPPA compliant", "GDPR compliant", or similar. Write "designed to support <requirement>; requires legal review". Do not draft a public compliance statement until I tell you counsel has reviewed it.
6. **Data minimization.** Store only what a feature needs. Raw voice audio is not stored. Every data type gets a documented retention period and deletion path.
7. **Brand fidelity.** Use only approved assets (`brand/` and `assets/approved/`). If an asset you need is missing, don't build a substitute: request it through `docs/ASSET_PROTOCOL.md`.
8. **AI disclosure.** The child app always makes clear, in child-friendly words and visuals, that the companion is an AI and not a person.
9. **Small attack surface.** No user uploads of images, video or audio files, no user-to-user messaging, and no public sharing of child-generated content. Ask me before adding anything of that kind.
10. **Visual assets.** Claude Code does not draw or generate any visual asset: no hand-written SVG, canvas or CSS illustrations, no emoji stand-ins, no redrawn mascot. Every asset comes from me via ChatGPT (transparent PNG) using prompts you write; mascot poses are always made from the official mascot as the reference. Each delivered file is viewed by you, checked against the rejection list in `docs/ASSET_PROTOCOL.md`, logged in `assets/manifest.json`, and only then wired in. Until it arrives, use a grey labelled placeholder box marked `TODO(PLACEHOLDER)`. Only plain functional UI icons (back, close, settings, mic) may come from a standard icon library. Per-story illustrations are a product feature generated at run time through the safety layer (SPEC §5.2), not asset production.
11. **Cost discipline.** Every feature that spends credits has a per-child daily cap and a global kill switch that degrades to a cheaper mode (text only, pre-recorded audio). Fixed phrases and crisis scripts are pre-generated static audio, never generated per use.
12. **Mascot-first, child-first UX.** The mascot guides the child on almost every screen and is the voice companion's body (`docs/MASCOT.md`). It never guilt-trips, pressures or manipulates a child to stay. Big touch targets, one primary action per screen, minimal reading (audio and icons), no failure states.

## Workflow
- Work through one milestone at a time, in the order set in `docs/PLAN.md`.
- **Stop and ask me before:** adding a paid service or new external dependency of significance, changing the stack, any destructive migration, changing data retention or what parents can see, weakening or skipping a safety check or test, or making a design choice the brand assets don't settle.
- At the end of each milestone: run lint, typecheck, and tests. Then commit. Then update `docs/PLAN.md` and separate what was **verified by running it** from what was only written.
- Make small commits with descriptive messages. Never commit `.env` or real child data.
- When an integration is blocked by missing credentials, implement the code path and its error handling, document the gap, and move on. Don't fake the result.
- Provider features and prices change. Before relying on a limit, price, or API shape, check the provider's current documentation and note the date in `DECISIONS.md`.

## Tooling
You may install free skills and MCP servers the project needs, at project scope, from reputable sources, after reading them first (see the kickoff prompt). Ask me before anything that needs an account, a key, or sends data to a third party. Never install art or image-generation skills. Log everything in `docs/TOOLS.md`.

## Commands
<!-- Fill in after scaffolding: dev, test, lint, typecheck, migrate, seed (test-only data) -->

## Conventions
<!-- Fill in after scaffolding: folder structure, naming, API style, component patterns -->
