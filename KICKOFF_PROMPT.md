Paste the text below as your first message in Claude Code, in plan mode (Shift+Tab until "plan mode" shows).

---

We're starting Milestone 0 (Discovery and plan) of the project described in `CLAUDE.md` and `docs/SPEC.md`. Read both in full first, then `docs/ASSET_PROTOCOL.md`, `docs/MASCOT.md` and `docs/MAP.md`. Constraints: Vercel Hobby, about 120k ElevenLabs credits, Together AI credits, no Anthropic API key.

Three things matter most in this product: **child safety, the voice companion, and visuals.** The voice companion is the main feature and the mascot is its body, in the spirit of Duolingo's mascot but without any pressure or guilt. Visuals are central, so you never draw them: no SVG, canvas or CSS art, no emoji stand-ins. Whenever you need an asset (mascot pose, icon, badge, background, frame, anything visual), write a ready-to-paste ChatGPT prompt in `docs/ASSET_REQUESTS.md`, as the protocol says, and I will generate it with a transparent background. This applies to every feature, including the map, voice screen, stories, scenarios, collection and onboarding.

Do only Milestone 0 in this session. Do not scaffold the app or write application code.

1. **Inspect** the repository, `brand/` (open every image and read `BRAND.md`), `assets/approved/` (the global map images, vertical and horizontal, if present: open them), and `docs/safety/`. If the safety documents are missing, fetch them from the URLs in the spec, save them as Markdown in `docs/safety/`, and tell me.
2. **Brand audit and BRAND.md:** summarize what the brand defines (colors with hex values, fonts and their licenses, mascot poses and expressions, tone) and what it leaves undefined that the product needs. A DRAFT `brand/BRAND.md` exists; check it against the real files, fix errors (especially hex values), complete its gaps, and mark every statement "from the presentation" or "my inference". I approve it before it guides design.
3. **The interactive global map (current scope, `docs/MAP.md`):** look at both map images and describe the places you can see. Propose the `world.json` data model (maps per orientation, hotspot positions, path polylines, places, levels, unlock rules, pack metadata) so future places and "Feelio visits ___" packs need no code change. Propose the PWA, animation and gesture approach for a tablet-first, RTL-ready shell, including pan and zoom, orientation switching, the dev-only hotspot editor, and how the mascot marker walks the path. Only the global map is in scope; do not plan place maps beyond a note.
4. **Mascot and visual asset plan:** from `docs/MASCOT.md`, propose the mascot state machine for the Talk screen and the map, and write **Batch 1** of `docs/ASSET_REQUESTS.md` in full: mascot Batch A poses, dock icons, lock/star/check badges, level node images, and anything else the map, dock and mascot shell need. Each entry must have the exact prompt, reference images to upload, size, transparent background, and filename. Put the highest-priority items first.
5. **Legacy content:** inventory the scenario artifacts in `legacy/artifacts/` and propose the scenario schema and migration plan (SPEC §4.3).
6. **Safety requirements:** turn the Anthropic guidance into a numbered list of concrete requirements, each traced to its source, and draft `docs/SAFETY_POLICY.md`. Say which bind us directly and which we adopt as a standard. Flag anything in the spec that conflicts with the guidance.
7. **Provider verification.** Check the current documentation (not memory) and report what you verified, with the date, and what you could not verify:
   - ElevenLabs Agents: custom LLM through our OpenAI-compatible streaming route, session token or signed URL flow, max duration, session overrides, guardrails, **client tools (for mascot emotion states), session mode and output-volume events (for mascot states and mouth frames)**, post-call webhooks, creating and updating an agent through the API, and the real credit cost per voice minute.
   - Together AI: models for low-latency voice, story writing, safety classification (Llama Guard-class) and **run-time story illustrations** (consistency, cost per story, licence), with prices and rate limits.
   - Vercel Hobby: function duration, streaming, request limits and the non-commercial terms.
   If the custom-LLM proxy design does not work, say so and propose the closest alternative that keeps an in-line safety check.
8. **Authentication:** recommend one well-known library or service (SPEC §3.1), compare 2–3 options against the criteria there, and say what you verified.
9. **Architecture:** modules (safety, voice, stories, games, parent, auth, map and world, mascot, shared design system), data model, parent/child auth scopes, the voice session gate and safety proxy, and the degradation path when credits run out. One Mermaid diagram.
10. **Budget model:** from verified prices, compute how many voice minutes and sessions 120k credits supports under the spec's caps, and what a story costs. Mark verified versus estimated. Put it in `docs/BUDGET.md`.
11. **Threat model:** the top 10 risks (child safety, privacy, security, cost abuse) and mitigations.
12. **Credentials check:** read `.env.example`/`.env` key names only (never print values) and report which integrations can be built for real now and which are blocked.
13. **Tooling (skills and MCP servers):** find and install, yourself, any skill, plugin or MCP server this project needs, as long as it is **free** and from a reputable source (Anthropic's official repositories and marketplace, or the provider's own official repository, e.g. ElevenLabs, Vercel, Playwright). Likely candidates: a frontend-design skill, Playwright (webapp testing and screenshots so you can look at your own UI), a current-docs MCP for provider verification, the ElevenLabs MCP, GitHub. Rules:
   - Read a skill's `SKILL.md` or an MCP server's README and source summary **before** installing, and refuse anything that asks for payment, broad file or network access it doesn't need, or secrets.
   - Install at project scope only (`.claude/skills/` and `.mcp.json` in this repo), never globally.
   - Never install art, drawing or image-generation skills (they conflict with the visual asset protocol), and never give any third-party tool real child data.
   - Tell me before installing anything that needs an API key, an account, or sends data to a third party, and wait for my yes.
   - Also create these three project skills in `.claude/skills/`: `child-safety-review` (checklist run before each milestone commit, from CLAUDE.md rules and the safety policy), `asset-request` (the request format and rejection checklist from `docs/ASSET_PROTOCOL.md`), and `rtl-i18n-check` (English and Arabic strings, mirroring rules, never mirror the mascot).
   - Record everything installed in `docs/TOOLS.md`: name, source URL, version, why, what access it has, and how to remove it.
14. **Open questions:** everything you need me to decide, ranked by how much it blocks.

Also review the SPEC §9 milestones and tell me whether you would reorder them.

Write results to `docs/TOOLS.md`, `docs/PLAN.md`, `docs/ARCHITECTURE.md`, `docs/SAFETY_POLICY.md` (draft), `docs/BUDGET.md`, `docs/DECISIONS.md` and `docs/ASSET_REQUESTS.md`. Then stop and show a short summary plus the open questions. Wait for my approval before Milestone 1.

Think hard about the safety layer design, the abuse-disclosure case where the parent may be involved, and the latency versus safety trade-off of the proxy route; those are the decisions I most want to review.
