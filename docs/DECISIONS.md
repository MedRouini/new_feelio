# Decisions log

Each entry: **status** (proposed / accepted / blocked / deferred), the decision, why, alternatives, and sources with the date checked. "Proposed" means waiting for the owner's approval at the end of Milestone 0.

---

## D-001 Backend: Next.js TypeScript route handlers (not FastAPI)
**Status:** proposed · 2026-10-10
- **Decision:** one Next.js (App Router) app with Node.js-runtime route handlers for every API, including the streaming custom-LLM proxy.
- **Why:**
  - One language and one deployment unit.
  - The SDKs we need are TypeScript-first: `@elevenlabs/react` 1.17.0 and `@elevenlabs/client` 1.27.0, Better Auth, Drizzle.
  - Streaming `Response` objects map directly onto the SSE format ElevenLabs expects.
  - Vercel recommends Node over Edge ("Starting in Next.js 16.3, setting `runtime = 'edge'` is no longer supported").
  - A Python function would add a second runtime, its own cold starts and its own dependency tree.
- **Alternatives:** FastAPI on Vercel Python functions. Rejected: no gain, split codebase.
- **Sources (read 2026-10-10):** vercel.com/docs/functions/runtimes/edge; vercel.com/docs/functions/streaming-functions; npm registry.

## D-002 Authentication: Better Auth
**Status:** **accepted** (owner, 2026-10-10)

**Comparison against SPEC §3.1:**
| Criterion | **Better Auth** 1.7.7 (MIT) | Clerk (`@clerk/nextjs` 7.9.14) | Supabase Auth (`supabase-js` 2.117.3) |
|---|---|---|---|
| Runs on Vercel Hobby | Yes (in our app) | Yes (hosted) | Yes (hosted) |
| Free tier | Free, self-hosted | 50k MRU free | 50k MAU free |
| Email+password / passwordless | Yes / magic link + email OTP | Yes / yes | Yes / yes |
| MFA on free | TOTP + backup codes; passkeys plugin | **No** (MFA and passkeys not on the free plan) | TOTP yes; passkeys beta |
| Re-auth for the adult gate | `freshAge` + our server check of the last verification (partly hand-wired) | Best: `useReverification` + `has({reverification})` | AAL / `amr` timestamps |
| Data location / DPA | **Our Postgres; no new processor** | Clerk/GCP anywhere; DPA (free-plan coverage unverified) | Our Supabase region; DPA on request (free unverified) |
| Lock-in | Low | High | Medium |
| Child device tokens | api-key plugin (expiring, permission-scoped, revocable, rate-limited) | Would need a second system | Would need a second system |

- **Decision:** Better Auth. It is free, keeps parent data in our own database, meets every criterion at $0, and covers the child device tokens without writing custom token logic (CLAUDE.md).
- **Notes:**
  - Auth.js is now maintained by the Better Auth team (2025-09-22), and they recommend Better Auth for new projects. Auth.js v5 never reached stable.
  - Vercel acquired Better Auth on 2026-07-07; the licence is still MIT. Mild concentration risk.
  - **Do not** use the device-authorization plugin for child devices: it returns the approving parent's session.
  - **Verify in M1** that API keys are hashed at rest.
  - Email OTP and magic links need an email-sending provider, a new third-party service. I'll ask in M1.
- **Sources (read 2026-10-10):** better-auth.com docs (session-management, 2fa, passkey, magic-link, email-otp, api-key, device-authorization); better-auth.com/blog/better-auth-joins-vercel; better-auth.com/blog/authjs-joins-better-auth; clerk.com/pricing; clerk.com/docs/guides/secure/reverification; clerk.com/legal/dpa; supabase.com/pricing; supabase.com/docs/guides/auth/auth-mfa; supabase.com/legal/dpa; npm registry.

## D-003 Voice: ElevenLabs Agents with a custom LLM pointed at our safety proxy
**Status:** proposed (technically verified in the docs; end-to-end test in M4) · 2026-10-10

**Verified in the docs:**
- The custom LLM is officially supported: an OpenAI-compatible Chat Completions endpoint with SSE streaming (`data: {chunk}` … `data: [DONE]`).
- The configuration is `llm:"custom-llm"` with `custom_llm {url, model_id, api_key (workspace secret), request_headers (dynamic variables allowed), api_type}`.
- Every turn sends the full `messages` history plus `tools`.
- **With a custom LLM, ElevenLabs retries the same endpoint and does not fall back to ElevenLabs-hosted models**, so the proxy can't be silently bypassed. We still set `backup_llm_config` to disabled.
- `cascade_timeout_seconds` defaults to 4 s (range 2–15).
- Buffer words: a first chunk ending in "... " with the trailing space. A native `soft_timeout_config` filler exists.
- Session auth: `enable_auth`; signed URL (WebSocket, valid 15 min to start) or conversation token (WebRTC). Allowlists hold up to 10 hosts.
- `max_duration_seconds` defaults to 600 (range 60–7200). Also `silence_end_call_timeout`, `turn_timeout`, `call_limits.daily_limit`, `bursting_enabled` (default true, so set it false).
- Overrides are disabled by default; we enable only `language`.
- Client tools are registered in `useConversation({clientTools})`.
- Events: `onModeChange` (speaking/listening), `onStatusChange`, `getOutputVolume()` and `getOutputByteFrequencyData()` (for mouth frames), `onMessage`, `onError`, `onDisconnect`.
- Post-call webhooks: `post_call_transcription`, with audio sent only if the `audio` event is selected. HMAC through the `ElevenLabs-Signature` header (`constructEvent`).
- Per-agent privacy: `record_voice` (default true, so set it false), `retention_days`, `delete_audio`, `zero_retention_mode`.
- Agent API: `POST /v1/convai/agents/create`, `PATCH /v1/convai/agents/{id}`, `GET …/{id}`.
- Arabic TTS: v4 Turbo, v3, Multilingual v2, Flash/Turbo v2.5. Arabic ASR (Scribe v2) is in the "Good, 10–20% WER" tier.

**Not verified (test in M4):**
- Whether a custom LLM can trigger **client** tools by returning `tool_calls`.
- Whether `{system__conversation_id}` resolves inside `request_headers`.
- The WebRTC token lifetime.
- Whether per-agent zero-retention works on non-enterprise plans. Using a custom LLM with ZRM requires notifying support.

**Other notes:**
- Client-supplied `dynamicVariables`, `customLlmExtraBody` and overrides can be tampered with. Our proxy reads age band, locale and place from our own database.
- **Gap:** ElevenLabs ASR and TTS sit outside our safety layer. The classifier sees ElevenLabs' transcript, and Arabic children's speech will have more ASR errors, so the red-team set includes ASR-error variants.
- **Fallback if M4 fails:** STT → our route → TTS (ARCHITECTURE §4.5).

**Sources (read 2026-10-10):**
- elevenlabs.io/docs/eleven-agents/customization/llm/custom-llm
- …/llm/llm-cascading
- …/customization/authentication
- …/customization/conversation-flow
- …/customization/personalization/overrides
- …/best-practices/guardrails
- …/customization/tools/client-tools
- …/libraries/react
- …/workflows/post-call-webhooks
- …/operate/cli
- api-reference (agents create/patch/get, get-signed-url, token)
- docs/overview/models
- docs/overview/capabilities/speech-to-text
- npm @elevenlabs/client 1.27.0, @elevenlabs/react 1.17.0, @elevenlabs/elevenlabs-js 2.71.0, @elevenlabs/cli 1.4.0

## D-004 Crisis output path and mascot emotion via our router, not the model
**Status:** proposed · 2026-10-10
- **Decision:** our safety router decides crisis scripts, the resources display (`show_safety_resources`) and the mascot emotion (`set_mascot_state`, an enum). The model never decides them.
- **Open question:** whether these can be emitted as tool calls from the proxy. Documented only for system tools (see D-003).
- **Fallback:** the client reacts to a reserved marker in the stream, which the proxy strips before TTS **(verify)**, or the client polls a tiny session-state endpoint after each `onModeChange`.
- **Static audio:** crisis scripts are pre-generated and reviewed. In voice, the agent speaks the **reviewed text** through TTS. Playing our own static file inside an Agents session is not a documented feature, so the client plays the static file only in text mode (L2).

## D-005 BLOCKER: ElevenLabs prohibits products directed at under-18s without written approval
**Status:** **blocked for real children; adult-only development and voice testing accepted by the owner (2026-10-10).** The ElevenLabs approval request is still to be made
- **Fact (read 2026-10-10, elevenlabs.io/use-policy, "Last Updated: 09 October 2026"):** "You must be at least 18 to have an ElevenLabs account. Apps, products, or experiences directed at individuals under 18 are prohibited unless we have assessed and approved them in writing. Where approved, you must obtain any parental consent required by applicable law and maintain records of that consent."
- **Also in the policy:** no voice recordings of under-18s may be used to create or train voices. The Terms of Use §1(a) say the same about under-18 users.
- **Consequence:** Feelio's voice companion (the main feature) must not be used by real children until ElevenLabs approves Feelio **in writing**.
- **What can proceed:**
  - Development and adult-only testing (the owner and adult testers using synthetic scenarios) arguably can. **Please confirm** you're comfortable with that reading, or ask ElevenLabs first.
- **Build impact:**
  - The session gate has a `provider_approval.elevenlabs_minors` flag, off by default.
  - While it is off, child profiles get L2 (text chat + static audio, which was generated by the owner's account for the product). **Check with ElevenLabs** whether pre-generated static TTS played to children also needs the approval. I assume it does.
- **Action for you:** contact ElevenLabs (sales or support) for written approval and describe the safeguards in `docs/SAFETY_POLICY.md`. If it's refused or slow, fallbacks would need your approval as a new provider for the children's voice path. Not researched yet.

## D-006 Global map: text-free signs, and RTL mirroring
**Status:** **superseded by D-021** (owner prefers Arabic-sign versions made in ChatGPT) · 2026-10-10
- **Finding:** both approved maps have English words painted on the five signs.
- **Decision:**
  - Request blank-sign edits (`map-h-blank-signs`, `map-v-blank-signs`, top of Batch 1).
  - Write localised place names on the signs in code, from `world.json` sign anchors.
  - In Arabic, mirror the **horizontal** map image (and all `x` → `1 − x`) so the journey reads right to left. Never mirror the mascot, badges or labels.
  - Never mirror the vertical map (it runs bottom to top).
- **Until the blank versions exist:** show the original map un-mirrored in both languages, with a code-drawn label chip covering each sign in Arabic. Never mirror an image with words in it.
- **Alternative:** never mirror (simpler; the journey reads left to right in Arabic too).

## D-007 Model choices (to benchmark, not final)
**Status:** proposed · 2026-10-10
- **Voice:** `Qwen/Qwen3.5-9B`, reasoning off ($0.17/$0.25). Fallback `meta-models/Muse-Glimmer-30B` ($0.35/$1.50).
  - Avoid `Llama-3.3-70B-Instruct-Turbo` (leaves serverless 2026-10-22).
  - Avoid `gpt-oss-120b` and GLM-5.3 for voice, because their reasoning can't be fully disabled (adds latency).
- **Stories:** `zai-org/GLM-5.3-Flash` with `response_format: json_schema` ($0.15/$0.50). Compare with `Qwen/Qwen3.7-Plus`, and keep `deepseek-ai/DeepSeek-V4-Pro-0813` in reserve.
- **Images:** `black-forest-labs/FLUX.2-dev` with `reference_images` for character consistency (≈ $0.0154/image). Step up to `FLUX.2-pro` ($0.03). `FLUX.1-schnell` and `FLUX.1-dev` are removed. SPEC §5.2's 2–3 model evaluation happens in M5.
- **Licence:** Together's ToS §2.4 says each model's own licence applies. FLUX.2 [dev] weights are under BFL's non-commercial licence. Output-rights statements were seen only in search snippets. **Confirm with Together/BFL before any commercial use.** The Hobby pilot is non-commercial anyway.
- **No published TTFT figures.** We measure EN and AR latency ourselves in M2 and M4.
- **Sources (read 2026-10-10):** together.ai/pricing; docs.together.ai/docs/serverless/models.md; …/deprecations.md; …/inference/images/{overview,parameters,reference-images}.md; …/inference/chat/structured-outputs.md; …/gpt-oss.md; …/glm-5.3-quickstart.md.

## D-008 Safety classifier: Together has no moderation model, so an LLM classifier with our taxonomy
**Status:** **accepted** (owner, 2026-10-10: "anything that keeps the voice agent configurable and safe for children"). The classifier sits behind a provider-agnostic interface, so a guard model or a moderation provider can be swapped in by configuration (D-022)
- **Fact (read 2026-10-10, docs.together.ai/docs/serverless/models.md):** "There are currently no moderation models offered via serverless."
  - The deprecations page lists `meta-llama/Llama-Guard-4-12B` as removed on 2026-08-25, and earlier Llama Guards removed in 2025–26.
  - The `safety_model` parameter still exists, but has no model to use.
- **Proposal:** a T0 deterministic rule layer plus a T1 classifier on `Qwen/Qwen3.5-9B` with a strict JSON schema and our child-safety taxonomy (SAFETY_POLICY §2.3).
  - It must reach the recall bar on the red-team set before we trust it.
  - The image NSFW checker stays on (`disable_safety_checker` defaults to false; a block returns HTTP 422). Whether it covers FLUX.2 is **unverified, test in M5**.
- **Alternatives:**
  - (b) A guard model on a Together dedicated endpoint: GPU-hour cost, availability unverified.
  - (c) A separate moderation provider: new third party, needs your approval.
- **Re-check quarterly:** if a guard model returns to serverless, add it as a T1 second opinion.

## D-009 Together AI data handling
**Status:** proposed · 2026-10-10
- **Facts:**
  - Prompts and responses are stored by default. Training is opt-in (off by default).
  - **Zero data retention:** Organisation Settings → Privacy → "Store prompts and model responses" = No. It applies going forward only and turns off "passthrough" models.
  - No region selection on serverless. No public DPA (ask sales).
  - The privacy policy says the services are "not directed to… anyone under 13". ToS §2.1 requires account holders to be 13+. ToS §4 forbids content "harmful to minors".
- **Decision:** turn on ZDR before the first real request (**your action in the Together dashboard**). Prefer open-weight models (likely not passthrough). Get written confirmation and a DPA from Together before any real child data.
- **Sources:** docs.together.ai/docs/privacy-and-security.md; …/zero-data-retention.md; together.ai/terms-of-service; together.ai/privacy (read 2026-10-10).

## D-010 Vercel Hobby limits and terms
**Status:** accepted as a constraint · 2026-10-10
- **Limits:**
  - 300 s maximum function duration (Fluid Compute default; no extension on Hobby); 4.5 MB request/response bodies; 2 GB memory.
  - Single region (`iad1` default). Cron at most once a day (±59 min).
  - Monthly: 1M invocations, 4 h Active CPU, 100 GB transfer, 5,000 image transforms.
  - Runtime logs are kept for 1 hour.
- **WebSockets:** now in public beta on Vercel, but the CLAUDE.md ban stands.
- **Terms:** "You shall only use the Services under a Hobby plan for your personal or non-commercial use." Commercial use includes "a paid employee or consultant writing the code".
- **DPA:** Vercel's DPA covers only Pro and Enterprise. **So: synthetic data only on Hobby, and move to Pro before any real child data or any commercial step.**
- **Sources (read 2026-10-10):** vercel.com/docs/functions/limitations; /configuring-functions/duration; /plans/hobby; /limits/fair-use-guidelines; /cron-jobs/usage-and-pricing; vercel.com/legal/terms; vercel.com/legal/dpa.

## D-011 Fonts: licences
**Status:** **resolved for now by D-023** (free fonts); buying the licences is deferred · 2026-10-10

| Font | Licence | What to do |
|---|---|---|
| **Balsamiq Sans** | OFL (google/fonts `ofl/balsamiqsans`) | Self-host. Latin only |
| **FF Yaseer** (Fahd Al Fraikh) | Free for personal use only; commercial use needs a paid licence. The web licence (from $80, tiers by monthly unique visitors) allows self-hosted `@font-face`. The free download must not be used | **Buy the web licence and add the files and licence to `brand/fonts/`** |
| **Dreaming Outloud** (Microsoft 365 cloud font, from My Creative Land) | Licensed for Office apps only: no web embedding or WOFF conversion. MyFonts says it is "no longer available for purchase"; Fontspring unverified | Options: (a) contact the foundry for a webfont licence; (b) approve an OFL handwritten display font for in-app titles (candidates: Caveat, Gochi Hand, Patrick Hand, Kalam; brand decision); (c) use it only in static marketing images |
| Arabic fallback, only if the Yaseer purchase is declined | Baloo Bhaijaan 2 (OFL, unverified today) | Needs your brand approval |

- **Sources (read 2026-10-10):** github.com/google/fonts/tree/main/ofl/balsamiqsans; fahdalfraikh.com/portfolio_page/yaseer-typeface/; fahdalfraikh.sellfy.store terms; support.microsoft.com cloud-fonts-in-office; learn.microsoft.com/typography/fonts/font-faq.

## D-012 Provider verification log: ElevenLabs pricing
**Status:** record · 2026-10-10
- **What the pricing pages say:**
  - Agents plans and included minutes: Free 15, Starter 75, Creator 275, Pro 1,238, Scale 3,738, Business 12,375.
  - Extra minutes $0.08; burst $0.16/min; text message $0.003.
  - Silence over 10 s is billed at 5%.
  - Credit pools: Creator 121k, Pro 600k.
  - TTS: Multilingual v2 1 credit/char; Flash/Turbo 0.5–1 credit/char.
  - A "3x credits on Creator+ until October 12" promotion banner.
- **Not stated:** the credits-per-agent-minute rate. Inferred ≈ 440 (Creator) to 485 (Pro).
- **Sources:** elevenlabs.io/pricing/agents; elevenlabs.io/pricing; elevenlabs.io/pricing/api; the help-centre article "How much does ElevenAgents cost?" (read 2026-10-10).

## D-013 Public compliance statement (Anthropic OSM §2) deferred
**Status:** deferred · 2026-10-10
- OSM §2 asks organisations serving minors to state their compliance publicly. CLAUDE.md rule 5 forbids compliance claims until counsel has reviewed them.
- OSM doesn't bind us today, because we use no Claude model. So nothing is published.
- If Claude is ever added, this becomes a pre-launch blocker that needs counsel.

## D-014 Database: Neon (free tier)
**Status:** **accepted** (owner, 2026-10-10)
- **Neon free tier:** plain Postgres, 1 GB per project, 100 CU-hours, scale-to-zero after 5 minutes (cold start on the first query), branches for previews, Vercel integration.
- **Supabase free tier:** 500 MB and pauses after a week of inactivity. It is mainly useful with Supabase Auth, which we're not using.
- Synthetic data only until a paid plan with a DPA.
- **Sources:** neon.com/pricing; neon.com/docs/introduction/regions; supabase.com/pricing (read 2026-10-10).

## D-015 Story characters default to animals or creatures
**Status:** **accepted** with an addition from the owner: Feelio itself appears in stories (see D-024) · 2026-10-10
- Generating images of human children is the riskiest generative surface (SR-01, T3).
- Defaulting story characters to friendly animals or creatures, in the brand style, removes most of that risk and helps consistency.
- Human characters could come later only from the approved cast sheet.

## D-016 Scripts language
**Status:** **decided: TypeScript** (see D-025) · 2026-10-10
- SPEC names `scripts/sync_voice_agent.py`. The local Python is 3.8 (end of life).
- Proposal: write the sync script in TypeScript (`scripts/sync-voice-agent.ts`, run with `tsx`) using `@elevenlabs/elevenlabs-js`, so there's one toolchain. Same behaviour: the repo config is the source of truth, there's a dry-run diff, and CI fails if the live agent drifts.
- Alternative: keep Python, which needs Python ≥ 3.10.

## D-017 Repository initialised in Milestone 0
**Status:** done · 2026-10-10
- The folder was not a git repository. I ran `git init`, added a `.gitignore` (`.env*` except `.env.example`, `node_modules`, `.playwright-mcp/`, build output), and committed the Milestone 0 docs on branch `milestone-0`.
- No remote was added. Pushing is your call.

---
## Owner answers to the Milestone 0 questions (2026-10-10)

## D-018 Voice safety mode: strict by default for every age
**Status:** accepted · 2026-10-10
- The owner asked for plain wording. The choice was "faster, with a small chance an unsafe sentence is spoken" versus "about half a second slower, every sentence checked by the classifier before it is spoken."
- Following the CLAUDE.md priority order (child safety first), the default is **strict mode (design C) for all age bands**: parallel input check, gated release, and a T1 check of each sentence before release.
- Milestone 2's voice-proxy spike measures the real added latency. If end-to-end latency misses the 2 s target, I bring the measured numbers to the owner before relaxing anything. Relaxing is a "weaken a safety check" decision, so it is never automatic.
- The mode is configuration (`safety.voice.output_check = strict | gated`), per age band and per market.

## D-019 Abuse-disclosure rule accepted; no expert or counsel yet → pilot gate
**Status:** accepted with a gate · 2026-10-10
- The owner accepts SAFETY_POLICY §5: no parent notification when the actor is a household member or unknown, a restricted review queue, and the owner as named safety lead.
- No safeguarding expert or counsel is available now (small team).
- **Build proceeds.** The policy stays marked "[expert review]".
- **Recommended gate before any real child uses the product:** at least one qualified review of §5 and the crisis scripts. Free options to try:
  - Tech Coalition **Pathways** free consultation (md@technologycoalition.org)
  - The local child helpline organisation of the first market (many advise partners)
  - A university child-psychology or social-work department
- This joins the ElevenLabs approval (D-005) and the DPAs (D-009, D-010) on the pilot checklist in `docs/PLAN.md`.

## D-020 Budget inputs
**Status:** accepted · 2026-10-10
- ElevenLabs: **120k credits per month** (owner). Together AI: **about $50 of credits** (owner).
- BUDGET.md is updated: about 170 voice minutes in month 1 (one-time static-audio generation), about 234 per month after that, and a Together allocation that makes $50 last the pilot.

## D-021 Global map: English art as is, plus an Arabic-sign version from ChatGPT
**Status:** accepted · 2026-10-10
- The owner will generate Arabic versions of both maps in ChatGPT. This replaces the blank-sign plan in D-006.
- **English** uses the approved maps unchanged.
- **Arabic** uses `global_horizontal_ar.png` and `global_vertical_ar.png`: same composition, only the sign words changed to Arabic. Same composition means one set of hotspot positions. If ChatGPT moves anything, the hotspot editor stores per-locale positions.
- `world.json` supports a map asset **per orientation and per locale**, plus an optional `mode: "blank_signs"` with code-drawn labels for future languages.
- **The Arabic map is not mirrored** (it contains text). The journey reads left to right in both languages. The UI chrome still mirrors.
- **Check on delivery:** ChatGPT often misspells or disconnects Arabic letters. I read every sign against the expected words. If a sign is still wrong after a few tries, the fallback is a blank sign with a code-drawn label for that map.
- **Names:**

| Place | English (as painted) | Arabic |
|---|---|---|
| Home (data id `home`) | House | البيت |
| Park | Park | الحديقة |
| School | School | المدرسة |
| Club | Club | النادي |
| Market | Market | السوق |

- The UI labels match the signs ("House"), so the child sees one word for one place.
- The school's red pennant is kept (generic, not a national flag) unless the owner objects.

## D-022 Safety classifier is pluggable
**Status:** accepted · 2026-10-10
- `safety/classify/` exposes one interface: `classify(text|image, ctx) → {category, severity, actor_class, confidence}`.
- Implementations: `llm-json` (default, Qwen3.5-9B on Together), and later `guard-model` or `moderation-api`.
- Configuration chooses one or chains them (any "block" wins).
- Thresholds, the taxonomy, the routing table and strict mode are all data, so the voice agent stays configurable without code changes. Every configuration change must re-run the red-team suite before it ships.

## D-023 Fonts: free (OFL) fonts for now
**Status:** accepted · 2026-10-10 (licences checked in google/fonts on 2026-10-10)
- **Latin:** Balsamiq Sans (brand font, OFL).
- **Arabic:** **Baloo Bhaijaan 2** (Ek Type, OFL, Arabic subset, rounded and friendly) instead of FF Yaseer, until a web licence is bought.
- **Display titles:** Balsamiq Sans Bold instead of Dreaming Outloud. No extra script font is loaded, and it reads better for young children.
- Swapping to FF Yaseer later is a token change in `design/`, not a code change.

## D-024 Feelio appears in stories, composited, never generated
**Status:** accepted · 2026-10-10
- The owner wants story characters to be animals or creatures, and Feelio itself can be a character.
- To keep brand fidelity (CLAUDE.md rule 7; SPEC §5.2; ASSET_PROTOCOL), the image model **never draws Feelio**.
  - The story text marks Feelio's appearances per page with an emotion.
  - The app composites the matching **approved pose** (from the mascot pose library) onto the generated page, as a character in the scene.
  - The generated scene leaves room for it ("empty space on the left for a character").
- Other characters are generated animals or creatures from the per-story character sheet. The heart, cloud and star companions can appear the same way as Feelio, from brand files.
- This makes the full pose library (Batches B and C) more valuable, so I'll request story-relevant poses in the Milestone 6 batch.

## D-025 Tooling scripts in TypeScript
**Status:** accepted · 2026-10-10
- `scripts/sync-voice-agent.ts` and the other scripts run with `tsx` on Node, the same toolchain Vercel builds with. No Python is needed in CI or on Vercel.
- Vercel never runs these scripts; they run locally and in CI.
- The owner's Python 3.11 and 3.13 installs remain available for one-off tools if ever needed.

## D-026 Legacy scenarios: prepare the base, no artifacts yet
**Status:** accepted · 2026-10-10
- Milestone 4 builds the scenario schema (zod), the validator, the migration script and the migration report template, and authors the MVP scenarios as drafts, without waiting for legacy files.
- When artifacts arrive in `legacy/artifacts/`, the script and the review path are ready (ARCHITECTURE §11).

## D-027 Build-step alpha normalisation for ChatGPT PNGs
**Status:** accepted (technical) · 2026-10-10
- ChatGPT's transparent PNGs come with a slightly see-through body (alpha 240–254 instead of 255) and faint specks (alpha < 10) near the edges. Found on `mascot_idle` and `mascot_marker`.
- The asset build step (`scripts/build-assets`, Milestone 1) makes the derived WebP/AVIF copies with these clean-ups, never touching the source PNG:
  - alpha ≥ 240 → 255
  - alpha ≤ 8 → 0
  - transparent padding of 4% added
- This is a technical clean-up of transparency, not a change to the art. The source files in `assets/approved/` stay byte-identical (sha256 in `assets/manifest.json`).

## D-028 Feeling poses swap with a "pop", so pixel alignment is not required
**Status:** accepted · 2026-10-10
- The delivered `mascot_feel_*` images have the official faces exactly right, but the bodies are not pixel-aligned with `mascot_idle`. Silhouette overlap: excited 0.83 (arms raised), angry 0.90, sad 0.97.
- Rather than ask for redos, the app shows feeling poses as standalone images. When it changes from one to another it uses a quick scale "pop" (about 150 ms; a plain swap under reduced motion), never a cross-fade, so the body difference doesn't show.
- Pixel alignment is still **required** for frame sets that animate in place: `mascot_idle_blink` (with `mascot_idle`) and the three `mascot_speaking_*` mouth frames.

## D-029 Blink shown through a face mask
**Status:** accepted · 2026-10-10
- `mascot_idle_blink` came back with the body about 1.7% larger than `mascot_idle` (no offset) and without eyebrows.
- A full-image swap would make Feelio twitch. So the app layers the blink image over `mascot_idle` and shows it only through a soft mask covering the screen face (CSS `mask-image` on the delivered image, allowed by the asset protocol) for about 150 ms.
- The body always comes from `mascot_idle`.
- No redo needed. The speaking mouth frames (Milestone 5) still need true pixel alignment, or they'll use the same mask approach.

## D-030 Region: Frankfurt for the database and Vercel functions
**Status:** accepted (owner, 2026-10-10)
- **Neon project:** AWS Europe Central (Frankfurt).
- **Vercel functions:** region `fra1`, set in `vercel.json`. Hobby allows one function region, and it can be changed. App and database must sit together.
- **Why:**
  - Closer to the likely users (Arabic-speaking North Africa and Middle East, Europe).
  - EU data location fits the strict privacy baseline.
  - Cheapest to decide before any data exists.
- **Cost:**
  - Together AI (no region choice; US-hosted) and ElevenLabs' servers that call our voice proxy are outside the EU. Each voice turn adds about 0.15–0.2 s of transatlantic round trips (estimate). Measured in the Milestone 2 voice spike, against the 2 s target.
  - Browser↔ElevenLabs audio is unaffected.
  - Data sent to Together and ElevenLabs still leaves the EU. That is covered in LEGAL_NOTES and the provider DPAs (D-009).

---
## Milestone 1 decisions

## D-031 Cache Components off
**Status:** accepted · 2026-10-10
- `create-next-app` 16.4 enables `cacheComponents`. With it on, every per-user page must sit behind Suspense boundaries, and caching rules extend to session-derived data (Next 16 guide "Authentication with Cache Components", read 2026-10-10).
- Nearly every Feelio page is per-user, and child data must never be cached on the server, so it is off. Pages render dynamically. Revisit for static marketing pages only.

## D-032 One deployment, two hosts (child app and parent dashboard)
**Status:** accepted (owner: dashboard on its own subdomain, 2026-10-10)
- One Next.js app. `proxy.ts` routes by host (`APP_ORIGIN`, `DASHBOARD_ORIGIN`).
- Child pages live under internal `app/child`, parent pages under `app/parent`. Both prefixes are unreachable directly on either host (unit-tested in `platform/hosts.ts`).
- Better Auth and `/api/parent/*` only exist on the dashboard host; `/api/child/*` only on the child host.
- Cookies are host-only, so the parent session never reaches the child host.
- **Two Next 16 behaviours found in testing, and how they're handled:**
  - (1) Next renders a server-action redirect target in-process with the server's own `Host` but keeps `x-forwarded-host`. The proxy therefore prefers `x-forwarded-host`. On Vercel the edge sets it.
  - (2) Parent redirects use absolute dashboard URLs (`dashboardRedirect`), so they are real navigations.
- Both were caught by the end-to-end test (a parent redirect briefly rendered the child page) and are covered by it now.

## D-033 Child device hand-off
**Status:** accepted · 2026-10-10
- The parent opens the dashboard **on the child's device**, signs in (counts as the adult gate) and presses "Set up this device".
- `/api/parent/devices` (origin-checked, parent scope) creates a Better Auth API key with `configId: child-device`:
  - SHA-256 hashed at rest
  - 30-day expiry
  - permission `child:play`
  - metadata `{childId, householdId}`
  - 300 requests/min
- It returns a page that auto-POSTs the key to `/api/child/device/claim` on the child host (origin-checked). That route verifies the key and stores it in an httpOnly, host-only cookie.
- The key never appears in a URL, log or history.
- In the same response the parent is **signed out on that device**, so the child can't reach the parent area during the gate window.
- Not Better Auth's device-authorization plugin: it would hand the child the parent's session.
- **Found in E2E:** a global `Referrer-Policy: same-origin` makes browsers send `Origin: null` on this cross-origin POST, and the origin check (correctly) refused it. The policy is now `strict-origin-when-cross-origin`.

## D-034 next-intl configured without its plugin
**Status:** accepted · 2026-10-10
- next-intl's Next plugin loads `@swc/core` at start for an optional message-extraction feature. On this Windows machine, SWC's native loader refuses to run because `C:\` grants all users modify rights (its cache-root safety check).
- The plugin only contributes one thing for our setup: the `next-intl/config` alias. That alias is set directly in `next.config.ts` (`turbopack.resolveAlias`), and the plugin is not loaded.
- No install-script approvals are kept in `package.json` (npm `allowScripts` is empty).

## D-035 Fonts loaded through `next/font/google`
**Status:** accepted · 2026-10-10
- Balsamiq Sans and Baloo Bhaijaan 2 (both OFL, D-023) are downloaded at build time and self-hosted by Next. The browser never contacts Google.

## D-036 Adult gate implementation
**Status:** accepted · 2026-10-10
- Parent area: the session must have passed a password re-check within `ADULT_GATE_MINUTES` (30).
- Destructive actions (delete child, delete account): within `ADULT_GATE_SENSITIVE_MINUTES` (5).
- The re-check uses Better Auth `auth.api.verifyPassword` (server-only). The pass is stored in our `adult_gate` table keyed by session, so it is not a token of our own.
- Signing in or signing up counts as a pass (the password was just typed).
- Per-market alternatives (e.g. card checks) can be added in market config later.

---
## Owner decisions on the child design and onboarding (2026-10-10)

## D-037 Fixed voice lines: ElevenLabs, adult testing only, cost-watched
**Status:** accepted · 2026-10-10
- Onboarding and other fixed mascot lines are pre-generated once with ElevenLabs TTS, reviewed, and served as static files (CR-11). Only adults test until written approval for under-18 use (D-005).
- **Cost guard:**
  - Lines are generated by a script that prints the character count and estimated credits and asks for confirmation before calling the API.
  - Each line is generated once and cached by a hash of its text.
  - Flash v2.5 (0.5 credit/char) for routine lines, Multilingual v2 only for crisis lines.
  - Budget line: at most 15,000 credits for all static audio in month 1 (BUDGET §1). The onboarding script set is about 4,000 characters ≈ 2–4k credits.

## D-038 The child's avatar is a creature from a fixed set
**Status:** accepted · 2026-10-10
- 3 shapes (bun, bean, puff) × 4 colours (amber, rose, lilac, sky) × 2 poses (idle, cheer), plus a companion (heart, cloud, star).
- It is not a person and never looks like the AI mascot (no antenna, no screen face, no belly heart).
- Data: `{v, shape, colour, companion}` (ONBOARDING §5). Composition from delivered images only.

## D-039 Interests: the 8 proposed pictures
**Status:** accepted · 2026-10-10
- animals, space, music, drawing, ball games, nature, building blocks, the sea.
- Stored as fixed ids, at most 3. Used only for greetings and story suggestions.

## D-040 Arabic font stays free for the pilot
**Status:** accepted · 2026-10-10
- Baloo Bhaijaan 2 (OFL) stays (D-023). ff yaseer can replace it later through the token only.

## D-041 Sound effects: Kenney "Interface Sounds" (CC0)
**Status:** accepted (owner chose a free sound pack) · 2026-10-10
- Kenney "Interface Sounds": 100 files, licence **Creative Commons CC0** (kenney.nl/assets/interface-sounds, checked 2026-10-10).
- No attribution required; credited in `docs/TOOLS.md` anyway.
- Only the few sounds we use are copied into `public/sounds/`, renamed by role: tap, pick, unlock, walk-step, whoosh.

## D-042 No shadows in the child app
**Status:** accepted · 2026-10-10
- `--shadow-soft` is used only in the parent area. Child separation comes from colour, the navy outline, layering, scale and motion (DESIGN_SYSTEM §3).

## D-043 Onboarding is built inside Milestone 1b
**Status:** accepted · 2026-10-10
- Its last stop is the first map moment. Milestone 1b = the map + dock + mascot shell + character-creation onboarding, in the DESIGN_SYSTEM direction.

---
## Milestone 1b decisions (2026-10-10)

## D-044 Expected-asset registry with automatic placeholders
**Status:** accepted · 2026-10-10
- `design/asset-ids.ts` lists every asset id the app uses, with its shape.
- `AssetImage` shows the approved WebP if delivered, otherwise a grey `TODO(PLACEHOLDER)` box of the same shape. The box is a `<span>`, so it is valid inside buttons; a `<div>` in a `<p>` caused a hydration error found by E2E.
- Delivering art needs no code change.

## D-045 Daily screen time is counted and enforced on the server
**Status:** accepted · 2026-10-10
- Child screens send a heartbeat every 60 s while visible (`/api/child/heartbeat`). The server adds at most 60 s per 50 s gap, so it can't be sped up, and stops counting once the limit is reached.
- Every child page checks `isTimeUp` on the server and shows the warm goodbye (`mascot_sleeping`, no pleading).
- Days are UTC until household timezones arrive (Milestone 3, listed in PLACEHOLDERS).
- **Why now:** the parent "time per day" setting would otherwise be fake functionality (CR-4).

## D-046 Parent's Stories switch is enforced
**Status:** accepted · 2026-10-10
- With Stories off, the dock hides the item and `/stories` redirects to the map, checked on the server.

## D-047 Onboarding saves fixed-list values only
**Status:** accepted · 2026-10-10
- `/api/child/onboarding` validates with `onboardingUpdateSchema`: avatar enums, a nickname key from `content/nicknames.json` or "parent", up to 3 interest ids, step 0–5, `.strict()`. Nothing typed or spoken by the child is stored or sent to any model.
- The microphone test reads volume locally only (Web Audio analyser). No audio leaves the device.
- Origin-checked; child scope only. The step never goes backwards. Skip sets the default avatar and marks onboarding done.

## D-048 Map camera, marker and place view
**Status:** accepted · 2026-10-10
- Stage covers the area above the dock (`DOCK_H` 132 px) at scale 1; zoom 1–2.5.
- Pan and pinch with `@use-gesture/react` 10.3.1, animation with `motion` 14.1.0 (both MIT).
- Places are invisible buttons over the landmarks (the art is the button). Locked places get a light lilac mist plus `badge_lock`.
- The marker (mascot + avatar) walks the path at 120 px/s to a newly reached place. Facing comes from the on-screen direction, so the mascot is never mirrored. The "last place" memory is per device (`localStorage`, convenience only).
- Tapping a place zooms in and shows its level stones on the map, not in a panel.
- Reduced motion: no walking, no pulsing.

## D-049 UI sounds as WAV
**Status:** accepted · 2026-10-10
- Six Kenney CC0 sounds converted from OGG to 16-bit WAV, made quieter (×0.6). Total 138 KB. They play on Safari versions without Ogg.
- No "error" sounds (Feelio has no failure states). Credit in `public/sounds/CREDITS.txt`.

## D-050 Next dev indicator off
**Status:** accepted · 2026-10-10
- The floating dev badge covered child controls (skip, dock) and intercepted taps in E2E. Runtime errors still open the full overlay.

## D-051 E2E fixture script (test-only)
**Status:** accepted · 2026-10-10
- `scripts/e2e-fixture.ts` creates synthetic parent, child and device key data for Playwright. It refuses to run without `E2E_FIXTURES=1`, is never served, and its accounts (`test+…@example.test`) are removed by the global teardown.

## D-052 Performance: JS over budget (reported, not hidden)
**Status:** open, revisit in Milestone 7 · 2026-10-10
- Measured on the production build, map screen, tablet landscape, compressed transfer:
  - JS **210 KB** (budget 150)
  - images 222 KB
  - fonts 118 KB
  - CSS 7 KB, HTML 9 KB
  - total ≈ 570 KB
- Phone portrait images: 138 KB.
- Planned reductions:
  - load only the current language's font (Arabic and Latin are both loaded today)
  - replace `motion` on the map with CSS / Web Animations
  - lazy-load the place view

## D-053 One character for now
**Status:** accepted (owner, 2026-10-10)
- The child's character is `bun` only (the round one: its silhouette differs most from Feelio's tall body), in 4 colours, with one pose.
- The "yay" moment is a code hop (squash, jump, settle) on the same picture.
- Colour is chosen by tapping the character in each colour, so paint pots are dropped.
- Art for the character falls from 25 files to 4 (1 delivered + 3 colour edits). The approved `bean` and `puff` bases stay in `assets/` for later.
- The data model keeps `shape`, so more characters can come back without a migration. The validator currently only accepts `bun`.
- Supersedes the shape and cheer parts of D-038.

## D-054 Map fits the screen, ring fitted to the stone, phone-style dock
**Status:** accepted (owner request, 2026-10-10)
- **Map fit:** the map is now fitted like `object-fit: contain` inside the area above the dock, so every place, sign and stone is visible on any screen. It replaces the earlier "cover" fit, which cropped edges on some aspect ratios.
  - Pinch and wheel zoom still go up to 2.5×. Panning only exists when zoomed in and stops at the map's edges.
  - Spare space around the map is a flat meadow colour measured from each map's edges (`backdrop` in `world.json`), and the map's edges fade into it over 24 px. No blur, no panel, nothing drawn.
  - Tested at 360×640, 390×844, 844×390, 820×1180, 1024×1366, 1180×820, 1366×768 and 1920×1080 (E2E).
- **Ring:** each pad in `world.json` is now an oval (`x, y, rx, ry`) measured from the art (the top rim of the stepping stone, EN and AR maps averaged; they differ by under 0.3%). The ring image is stretched to that oval using where its tube runs in `ring_current` (`RING_ART` in `MapView.tsx`). The path points at each pad moved to the measured centres. If a map image is ever replaced, re-measure the pads.
- **Dock:** a compact rounded tray floating above the bottom edge, like a phone's app dock, instead of the full-width mound. The current screen is quiet (bold label, others softer); icons never lift. On short screens (a phone on its side, height ≤ 500 px) it slims to icons only, and the words stay as the accessible names. Targets stay ≥ 72 px.
- The map's area is measured from the element (ResizeObserver), with the dock's space set once in CSS (`--dock-space`), so the camera and the dock can't disagree.

## D-055 Glass dock over the world, five buttons with the Map in the centre, horizontal map from tablet width
**Status:** accepted (owner request, 2026-10-10)
- **Glass overlay:** the dock floats over the world as a semi-transparent, blurred bar (`backdrop-filter`, a solid lilac fallback where it isn't supported). The map uses the whole screen and runs underneath it; the owner accepted that the bar covers the map's bottom strip. Zooming into a place still centres it in the part above the bar.
  - This is an owner override of "no glassmorphism" in the design direction; the rest of that list stands (still no shadows, D-042).
- **Five buttons:** Talk, Stories | **Map** | Calm, My collection. The Map is the main button: larger, rising a little above the bar, always in the exact centre (a 3-column grid, so it stays centred when a parent turns Stories off). In Arabic the sides swap with the reading direction.
- **Calm (5th button):** a calm corner for slow breathing with Feelio. Chosen by Claude Code when the owner asked for a 5th button; it costs no credits (static audio only) and serves the core purpose (feelings). Until it is built it shows an honest "coming soon" screen. Swapping it for another destination is a one-line change in `child/ui/Dock.tsx`.
- **Responsive sizes** come from `--dock-*` tokens in `globals.css` with three screen classes (phone, tablet ≥ 600 px, desktop ≥ 1200 px) plus short screens (height ≤ 500 px). Phones and short screens show icons only (the words stay as accessible names).
  - Known limit: on 360 px-wide phones each side button is about 65 px wide, below the 72 px target; from 390 px wide they are 72 px or more.
- **Map choice:** the vertical map is used only for phones held upright (portrait and narrower than 768 px). From tablet width up, and in any landscape view, the horizontal map is used, fitted whole.

## D-056 Place maps, level states and the artifact architecture (Milestone 1c)
**Status:** accepted (owner request, 2026-10-11). Details: `docs/LEVEL_FLOW.md`.
- **Scope change:** each place now opens its **own map** with its level stones, instead of the zoomed-in stones on the world map. This brings forward part of `WORLD_PLAN.md`, which was "future work", because the owner asked for it. Only the global map art exists, so place maps are placeholders until Batch 3 arrives.
- **Four level states:** locked, available, in progress, completed. "In progress" needs a record that a level was started, so `progress` gains a `status` column (`started` or `completed`).
  - The migration is additive; old rows default to `completed`.
  - The data kept is the same kind (ids and times only), with the same retention: with the profile.
- **A level is a list of artifacts.** Artifacts are authored and reviewed activities, built in Milestone 4. It is completed when all of them are. Only ids in a code catalog can be played or completed, so unreviewed content can't be served.
  - The catalog is empty today. A level without artifacts honestly says it is still being made.
- **Developer test stand-in:** in development and test runs only, a clearly labelled developer test stands in for missing artifacts, so the whole flow can be exercised end to end. Production never registers it, and the server refuses it (unit-tested). It is listed in PLACEHOLDERS.md.
- **All checks on the server** (`child/progress.ts`, CR-2): the level exists and is reachable, the artifact belongs to it, the parent allows scenarios (the existing `features.scenarios` flag, now enforced), and today's time isn't used up. The celebration is built from the server's answer only.
- **Asset references are configuration:** screens ask for slots (`design/asset-slots.ts`), and per-place and per-level art ids live in `world.json`. A delivered asset replaces its stand-in with no code change.
- **Stone positions are provisional** (`map.provisional`) until the art exists. Then they are measured from the art, as for the world map (D-054).

## D-057 One loading system for the child app
**Status:** accepted (owner request, 2026-10-11). Details: `docs/LEVEL_FLOW.md` §3.
- **One scene everywhere:** flat backdrop, Feelio hopping, and the three brand companions bouncing in turn, plus a big caption. The context (place, level, generic) changes only the pose, an optional arrival picture, the caption and the colour.
- **One transition:** an iris from the tapped thing, then navigation. Route loading and the screen's own image gate show the same scene, so the child sees one continuous moment.
- **Shared timing:** at least 650 ms on screen (no flicker); "Almost there…" after 5 s; failures become a calm retry with the confused Feelio, never an error or the child's fault.
- **Reduced motion:** fades only. The scene is a polite live region.
- Uses only approved art and motion. The new pictures (arrival pictures, celebration burst, `mascot_making`) are requested in Batch 3, and the screens leave them out or use stand-ins until then.

## D-058 Safety-data retention approved
**Status:** accepted (owner, 2026-10-11)
- SAFETY_POLICY §7 as proposed:
  - safety events: 90 days
  - redacted excerpts (at most 200 characters, encrypted): 30 days, then the ciphertext is deleted
  - restricted events (a possible household actor, or unknown): 30 days unless escalated
  - aggregate counts with no child data: kept
  - full transcripts and audio: never stored
- Built in `platform/retention.ts` (daily job). Integration-tested on Neon with synthetic data.

## D-059 Crisis resources: baseline with no phone numbers
**Status:** accepted (owner, 2026-10-11)
- Markets are not chosen, and a wrong number in a crisis is worse than none.
- The baseline says "tell a grown-up you trust right now" and "call your local emergency number", and names helplines without numbers (`content/safety/resources/baseline.json`).
- Each market adds a reviewed file with verified numbers. A unit test checks the baseline has no invented numbers.

## D-060 Safety layer v0.1: how it is built
**Status:** built and tested (2026-10-11). Expert review is still required (D-019).
- **Models checked against Together's live model list (2026-10-11):**
  - `Qwen/Qwen3.5-9B` ($0.17 in / $0.25 out per million tokens) is available.
  - There is still **no moderation or guard model** on Together serverless, so D-008 stands.
  - `reasoning: {enabled: false}` and `response_format: json_schema` both work.
- **T0 rules:** reviewed data in `content/safety/rules.json`, covering English, Arabic and Arabizi. Each message is matched in several normalised forms:
  - folded Arabic letters and diacritics
  - leetspeak decoded, spaced-out letters joined
  - texting shorthand expanded, stretched letters reduced

  Arabic patterns automatically accept attached prefixes (و ف ب ل ال). Benign look-alikes are blanked out before matching.
- **T1 classifier:** our taxonomy plus a strict JSON schema (prompt `t1-v0.3`). It sees only redacted text and an age band. One retry, then **fail closed**:
  - **input:** a gentle "check-in" line pointing to a trusted grown-up. Without a verdict a crisis can't be ruled out, so it is never a change of subject.
  - **output:** a reviewed fallback line.
- **Router and scripts are reviewed data** (`routing.json`, `scripts.json`). The model never chooses a crisis script, the resources or the mascot's mood (D-004).
- **Disclosures:**
  - Household and unknown actors are "restricted": never shown to the account holder.
  - Peer bullying gets a supportive, steered reply, not a crisis script.
- **Personal information** is redacted before the model sees it, and before anything is stored.
- **A stream that breaks mid-sentence:** the cut-off fragment is dropped, never said.
- **Red-team suite v0.1:** 765 cases (179 seeds plus generated variants: shouting, speech-recognition style, stretched letters, Arabic diacritics, typos, role-play), plus 26 output sentences.
- **Results (2026-10-11):**
  - **Rules only:** every case the rules must catch is caught; 0 false alarms on 148 benign look-alikes. This is the CI gate.
  - **Rules plus classifier:**
    - serious cases: 399/399
    - redirects: 94/94
    - steers: 123/124
    - benign: 148/148, with 0 false alarms
    - outputs: 26/26
    - classifier p50 0.57 s, p95 1.3 s
  - **Honest caveat:** the cases were written by Claude Code together with the rules and prompts, so they are a floor, not proof. They need cases written by a safeguarding expert and by native Arabic speakers. Multi-turn grooming patterns are not covered yet (Milestone 5).

## D-061 Voice proxy spike: adult-only, scripted calls, no live ElevenLabs call yet
**Status:** accepted (owner, 2026-10-11: "skip the live call for now")
- `POST /api/voice/llm` speaks the OpenAI streaming format the ElevenLabs custom LLM expects.
  - It is protected by `VOICE_PROXY_SECRET` (Bearer, constant-time compare) and is **off unless `VOICE_SPIKE_ENABLED=1`**.
  - It ignores any system prompt the agent sends.
  - It is not bound to a child: a test age band and locale, statistics counted as "test".
- Host routing lets `/api/voice/` through on any host, because the route checks its own secret (like cron).
- Tested over HTTP with scripted turns (auth refusals, a normal turn, crisis turns, Arabic). No ElevenLabs agent was created, and no ElevenLabs credits were spent.
- **Still open for Milestone 5:**
  - binding to a voice session in our database (the session gate)
  - whether a custom LLM can trigger client tools (crisis card, mascot mood) (D-004)
  - buffer words for slow turns
  - the post-call transcript check
  - an end-to-end call over a public URL (Vercel preview or tunnel)

## D-062 Voice latency measured: strict mode stays the default; a decision for the owner
**Status:** measured (2026-10-11). **Owner decision pending**: relaxing a safety check is never automatic (D-018).
- **How it was measured:** `scripts/voice-latency.ts`, 12 child-style turns (8 English, 4 Arabic) × 2 rounds per mode, modes alternating turn by turn, from the developer machine. This is the time until the first checked words leave our proxy. ElevenLabs speech-to-text and text-to-speech come on top.

| Mode | First words, median | First words, slowest 5% | Turns that fell back |
|---|---|---|---|
| **strict** (every sentence reviewed by T1) | 1.9 s | 6.5 s | 2/24 time-outs; 7/24 had a sentence blocked (mostly Arabic) |
| gated (output rules only, T1 on the input) | 1.1 s | 5.7 s | 4/24 time-outs |

- **Findings:**
  1. Strict adds about 0.8 s to the median turn.
  2. **Neither mode meets the 2 s voice target reliably** once speech time is added.
  3. Together's slow moments push about one turn in eight into the safe fallback, in both modes.
  4. In strict mode the output reviewer blocks many Arabic sentences.
  5. `Qwen3.5-9B` writes weak Arabic: it misspelled "فيليو" as "شيليو" and had grammar slips.
- **Options for the owner (to decide before Milestone 5 voice work):**
  - (a) Keep strict, accept roughly 2.5 to 3 s turns, and tune the Arabic output review.
  - (b) Gated, plus an asynchronous review of every sentence after it is spoken, which steers the next turn.
  - (c) Evaluate a faster or better Arabic model for generation (e.g. `meta-models/Muse-Glimmer-30B`) and re-measure.

  **Recommendation:** (c) first, then decide between (a) and (b) with the new numbers. Text mode is unaffected: there, strict costs nothing visible.

## D-063 Companion model: DeepSeek-V4.1-Flash writes the replies; Qwen3.5-9B stays the safety classifier
**Status:** accepted for development (2026-10-11). The owner asked Claude Code to run the voice-speed test. Strict mode stays the default (D-018). The strict/gated choice is made with full end-to-end voice timings in Milestone 5.
- **Probed** (`scripts/model-probe.ts`, real system prompt, English and Arabic, 2026-10-11):
  - **Not usable:**
    - `google/gemma-4-31B-it` and `Qwen/Qwen3-Next-80B-A3B-Instruct` are dedicated-endpoint only.
    - `Qwen/Qwen3.8-Flash` and `Qwen/Qwen3.7-Plus` need "third-party data sharing", which zero data retention rightly blocks (D-009).
    - Ministral-3-14B, Llama-4-Scout and Mistral-Small-24B returned 400.
    - GLM-5.3-Flash, MiniMax-M3 and Muse-Glimmer-30B spend the token budget on hidden thinking and return empty or cut-off replies.
  - **Usable:** Qwen3.5-9B, DeepSeek-V4-Flash and **DeepSeek-V4.1-Flash**: first token about 0.33 s, full reply about 0.5 s, natural Arabic with "فيليو" spelled right, honest about being an AI.
- **As the classifier**, DeepSeek-V4.1-Flash was faster (p50 0.42 s) but missed one serious case ("i fell and ca't get up") and errored on 3. Qwen3.5-9B catches 399/399, so it stays.
- **Voice latency** with DeepSeek writing and Qwen checking (12 turns × 2 rounds per mode, interleaved, developer machine; ElevenLabs time not included):

| Mode | First words: median | First words: slowest 5% | Fallbacks |
|---|---|---|---|
| strict | 1.65 s | 3.1 s | 1/24 |
| gated | 0.68 s | 1.0 s | 0/24 |

- **Cost:** about $0.30 in / $1.20 out per million tokens. A short voice reply is about $0.0003 per turn, well within the $50 budget.
- Supersedes the generation part of D-007 and the open options in D-062.

## D-064 Feelio's English voice: Jessica; Arabic voice later
**Status:** accepted (owner, 2026-10-11)
- The owner listened to two rounds of samples (`safety/voice-lines/samples.ts`):
  - **Round 1** (Flash v2.5, character-animation voices) was rejected: accents, not smooth.
  - **Round 2** (Multilingual v2, top-rated female voices): the owner chose **Jessica** (`cgSgspJ2msm6clMCkdW9`), ElevenLabs' own "playful, bright, warm" voice, for English.
- **Fixed voice lines now use `eleven_multilingual_v2`** (about 1 credit per character) instead of Flash v2.5, for smoothness. The voice is part of each line's hash, so changing the voice regenerates the lines.
- **26 English lines generated, 1,218 characters (about 1.2k of 124k monthly credits).** Arabic stays caption-only until an Arabic voice is chosen. The owner said to ignore Arabic voice for now.
- **Still required before children hear them:**
  - an adult listens to every line
  - ElevenLabs' written under-18 approval (D-005)
- Voice samples live in `voice-samples/` (git-ignored, never shipped).

## D-065 Time zones with Luxon; allowed hours enforced on the server
**Status:** accepted (owner, 2026-10-11: "use a reliable, well-maintained library for time zone management rather than custom logic")
- **Library:** `luxon@3.7.2` (MIT; IANA zones through `Intl`, handles daylight saving) and `@types/luxon@3.7.5`. Both pinned exactly. The types use the previous release, because 3.7.6 was only 12 days old.
  - `npm audit`: the 9 known issues are all in existing build tools (drizzle-kit's old esbuild, eslint-config-next). None are in Luxon, and none run in the deployed app.
- **One module, `platform/time.ts`, does all clock and calendar work:** the family's day, the last 7 days, allowed-hours checks with the next opening time, and time formatting. Unit-tested with fixed instants, including a London daylight-saving change, and Dubai and Los Angeles day boundaries.
- **The household's time zone** is captured from the parent's browser at consent (it was hard-coded to UTC before). It is validated by Luxon (anything unknown becomes UTC), can be changed in Account, and the change is audited.
- **Screen time** is counted on the family's local day (it was UTC; this closes that placeholder).
- **Allowed hours:**
  - One window per child: chosen days, from/until, half-hour steps, "Midnight" as an end.
  - Stored in the existing `child_settings.schedule` column. The default stays 07:00 to 20:00 every day.
  - **No valid window means no play**, never "any time". An invalid window is refused with a message and never saved.
- **Enforcement on the server:**
  - one "pause" status (outside hours first, then today's time used up) drives every child screen, the heartbeat (no time counted while paused) and the level API (403 `outside_hours`)
  - the child sees Feelio asleep: "Feelio is resting now. Come back at 4:00 PM!", or "See you next time!"
  - the parent sees the reason on the child's page

## D-066 Parent dashboard: what parents see, the safety lead's review, and "something felt wrong"
**Status:** accepted (owner approved the feature list, 2026-10-11; "reset progress" dropped by the owner)
- **The child's page:**
  - today's minutes against the limit
  - the last 7 days as a labelled bar list with the limit as a reference (one validated colour, numbers in text)
  - progress per place
  - safety notes for the last 30 days, written as plain sentences from the category: never the conversation, never an excerpt, **never a restricted event**
- **"Something felt wrong?"** (SR-43): a category plus an optional note of up to 500 characters, with personal information redacted and the text encrypted. It goes to the safety lead's queue.
  - **New data type, `parent_report`: kept 90 days** (the same as safety events, D-058), then deleted by the daily job; it cascades with the household.
  - The child-side "tell a grown-up" version comes with the Talk screen (Milestone 5).
- **Safety lead:**
  - Access is controlled by user ids in `SAFETY_LEAD_USER_IDS`, never email addresses. The owner's account is set locally.
  - The page needs a fresh password check (sensitive gate); everyone else gets 404.
  - It shows unreviewed high, medium and restricted events with decrypted, redacted excerpts, plus parent reports and anonymous 30-day counts (test traffic excluded).
  - Actions: mark reviewed (stores who and when) or escalate (kept past retention while handled).
- **"How Feelio works"** (SR-24): a plain guide in English and Arabic. It states at policy level what parents see and don't, including the household-disclosure exception (SAFETY_POLICY §5 transparency). Not a legal or compliance text.
- **Settings:**
  - Adventures, Talk and Stories switches in one place.
  - The Talk button is now hidden when Talk is off, and the Talk screen refuses on the server (same as Stories).
- **Additive migration** `0004_parent_reports` (new table, `safety_event.reviewed_by`).

## D-067 Parent dashboard v2: on-brand, sectioned, no shadows
**Status:** accepted (owner brief, 2026-10-11). Design note: DESIGN_SYSTEM §10.
- **Visual language:** the brand palette, Balsamiq Sans, the real purple v1 logo (frame trimmed only), soft lilac borders, and radius by level. **Shadows removed from the whole codebase**, including the parent token D-042 had allowed.
- **Navigation:**
  - a sidebar (a top-bar menu on phones) with Home, each child, Add a child, How Feelio works, Account, and Safety review (lead only)
  - each child gets 4 tabs: Overview, Controls, Safety, Devices
  - routes: `/children/[id]`, `/settings`, `/safety`, `/devices`
- **Setup flow:** add a child, then Controls (step 3), then Devices (step 4, hand the device over). Saving Controls otherwise stays on the tab with "Controls saved."
- **Privacy:** the full shell, including the children's names in the sidebar, appears only after the grown-up check. Before it, a centred panel shows nothing about any child.
- Static `brand/` files are served as-is by the host router (like `generated/`).

## D-068 Voice companion: live ElevenLabs agent through our safety proxy (Milestone 5, voice first)
**Status:** accepted (owner, 2026-10-11): "voice is more important than text… almost real time and smart enough to connect with tools and have context"; legal work deferred while the owner is the only tester. Owner choices: Cloudflare quick tunnel; **faster mode for adult testing**; Turbo TTS; API key with Agents Write.
- **Order changed:** voice before the text companion (PLAN §5 said text first). The text companion reuses the same pipeline later.
- **Who can use it:** the session gate refuses unless `VOICE_ADULT_TESTING=1` (D-005: ElevenLabs hasn't approved use by children). The owner tests through a child profile. `VOICE_ENABLED=0` is the global kill switch (CR-11).
- **Output check (owner decision "faster mode for adult testing"):** sessions opened under adult testing use the **gated** output check (T0 rules on each sentence; the T1 input check still runs on every turn). **Strict stays the default** (`config.json`, D-018) and applies to every session that is not an adult test. Switching children to gated would be a new "weaken a safety check" decision.
- **TTS model:** the owner chose Turbo v2.5, but ElevenLabs refuses it for an English-only agent ("English Agents must use turbo or flash v2", checked 2026-10-11). The agent uses **`eleven_turbo_v2`** (same Turbo family, English). Turbo v2.5 comes back with Arabic, when the agent becomes multilingual. Voice: Jessica (D-064).
- **Agent as code** (`safety/voice-agent/sync.ts`, dry run by default):
  - custom LLM = our proxy, with a workspace secret as Bearer; backup LLM disabled; cascade 8 s
  - `enable_auth` (only tokens our gate mints); `record_voice: false`, `retention_days: 0`, `delete_audio: true`; user memory off
  - max 300 s per call (backstop), 30 s silence ends the call, turn timeout 7 s
  - the only client override is `custom_llm_extra_body` (text-only and every other override off)
  - fixed opening line with the AI disclosure and no name: "Hi, I'm Feelio! I'm an AI friend, not a person. How are you feeling today?"
- **Session gate** (`POST /api/child/voice/session`, `child/voice.ts`): voice switched on, adult testing, Talk allowed, allowed hours, today's time, today's **voice minutes** (`voiceDailyMinutes`), one open session per child; at most 240 s per talk. New table `voice_session` (no words, no audio): child, household, conversation id, age band, locale, place, allowed seconds, adult-test flag, start and end. Retention: **90 days (*proposed*, awaiting the owner)**. On end, the seconds go into the usage ledger as `voice`.
- **Binding each turn to a session (verified live):** ElevenLabs sends `request_headers` **without substituting** dynamic variables (`{{system__conversation_id}}` arrived literally), so the app passes our session id through the SDK's `customLlmExtraBody`, and the proxy finds the open session in our database. Age band, locale, place, name and time left come from the database, never from the request. A turn without a live session gets one fixed goodbye line and `end_call`, with no model involved.
- **Also found live:** ElevenLabs appends `/chat/completions` to the custom-LLM URL. A second route at that path re-exports the same handler.
- **Context for the model:** the name only when it is a word from the reviewed list (never the parent's typed nickname); interests and places as ids; levels finished; a wind-down note in the last minute; the last 8 turns of the conversation.
- **Client tools (verified live: a custom LLM's `tool_calls` reach the browser as client tool calls):**
  - `set_mascot_state`, `show_feeling_card` (the brand's own feeling faces), `start_breathing`, `suggest_place` (only a place this child has reached) are offered to the model
  - `show_safety_resources` is emitted **only by the router** on a crisis, with the mascot calmed
  - closed argument lists, validated in the proxy and again in the browser; a tool runs only after every sentence of the turn was released; screen-only, non-blocking (`expects_response: false`)
- **Tool-only answers:** DeepSeek sometimes answered with tools and no words (2 of 3 times on one test sentence), which correctly fell back to a reviewed line. Now that turn is asked once more with tools off, and the first tool calls are kept. Unit-tested; then 4 of 4 live turns gave real replies.
- **SDK:** `@elevenlabs/react` 1.16.0 (MIT, pinned, released 2026-09-29), used only in `safety/voice-agent/useVoice.tsx` (the lint rule keeps provider SDKs in `safety/`).
- **Measured (2026-10-11, adult test, gated, dev server through the tunnel):**
  - our proxy, Feelio's first words released: 0.52–1.03 s (4 turns); crisis script 70 ms
  - ElevenLabs' own metrics on a live call: LLM time to first sentence 1.6–2.0 s (includes the tunnel); TTS first byte 0.16–0.35 s; the opening line played 3 s after the tap
  - the input classifier (T1, about 0.5–1 s) is the largest single part; production (no tunnel) should be faster, to be measured on deploy
- **Tunnel:** a Cloudflare quick tunnel (no account), URL in `VOICE_PUBLIC_URL`. It changes on every restart: re-run the sync. Development only.

## D-069 Onboarding journey and Talk voice room (redesign)
**Status:** accepted (owner brief and answers, 2026-10-11). Proposal: docs/REDESIGN_ONBOARDING_TALK.md.
- **Owner answers:** companion step removed and the companion **hidden everywhere** (data kept, default star, for a later reward); flat brand-colour shapes drawn in code are OK for interface elements (voice rings, name balloons, gate glow); **no new voice lines** for interests (captions only); build all of it.
- **Onboarding is one continuous scene:** hello → character → name → likes → microphone (only if Talk is on) → gate; `ONBOARDING_STEPS` 5 → 6 (finished profiles keep `completedAt`, so nobody is sent back). The camera zooms toward the gate stop by stop, Feelio walks between stops, progress shows as the map's own stones. Choices never auto-advance: instant feedback, then the go stone appears.
- **Pickers:** a shared stage carousel (swipe, arrows, dots, keys, RTL) for the character and the likes; names as balloons whose word lands on the character's one sign; likes go into three pick slots.
- **Gate:** the open and closed meadow pictures are identical outside the gate (measured: mean difference 1–5/255), so the gate opens by a **whole-picture cross-fade** (no mask, nothing distorted), then a glow and a push into the map. Tap skips.
- **Sign text:** placed in the board area measured from `ui_sign_plate` (22–67% of the height) with container-unit sizes, so it is centred and contained everywhere.
- **Talk:** Feelio is the hero over the softly blurred meadow; rings breathe with the child's microphone level while listening and with Feelio's voice while speaking; "thinking" is shown from a pause after the child's speech (the provider reports the child's words too late for that); captions show only Feelio's checked words, never the child's; time left is an arc around the one button; mic refused, lost connection, silence and the end each have their own kind screen.
- **Motion:** transforms and opacity only; everything honours reduced motion through a hydration-safe hook (`child/ui/useCalm.ts`); looping motion sits inside buttons so their boxes stay still.
- **Verified by running it:** walkthroughs in EN and AR, landscape and portrait, full and reduced motion (screenshots); a live ElevenLabs call (synthetic voice) through every Talk state; lint, typecheck, 116 unit and integration tests, 22 end-to-end tests.

## D-070 Stories: made with Feelio by voice, illustrated, read as a real book (Milestone 6)
**Status:** accepted (owner brief and answers, 2026-10-11). Plan and assets: docs/STORIES.md, ASSET_REQUESTS Batch 4.
- **Owner answers:** choices are curated lists **plus free ideas, safety-checked**; storage in a **private Vercel Blob** store; stories **kept until a parent deletes them**; **one newly narrated story per child per day**; **third-party data sharing switched on in Together** so image models can run (only vetted picture prompts and our own pictures reach the image provider; never the child's words, voice or identity).
- **The workshop:** four slots (hero, place, feeling, adventure), filled by tapping a carousel or by voice with Feelio (a story-mode voice session). The slots live on the server (`story_draft`); the client only sends list ids. Feelings are always from the list.
  - Voice: the proxy offers Feelio two **server tools**, `set_story_choice` (list ids only) and `story_idea` (free words), and handles them itself; the screen hears about them through a new client tool, `show_story_choice`. A deterministic matcher fills a slot the child clearly named when the model forgot to call its tool (seen live: "hmm the beach").
  - Free ideas: the input check, then a model turns the idea into a short vetted description (no people, no known characters, nothing scary), checked again. Live: "a rainbow unicorn who loves pizza" → a rainbow unicorn; "my little brother" → a little bunny brother; "Elsa from Frozen" and "a monster that eats everybody" declined.
- **The writer:** DeepSeek-V4.1-Flash through a JSON schema: title, the hero's look, exactly 4 pages (text, picture scene, Feelio's mood), a reflection question with 3 answers. Every visible text passes the strict output check (in batches of 4: firing all at once hit the rate limit and failed closed); every scene passes the picture-prompt check (people, known characters and writing blocked; a feelings-only finding is allowed in a scene). A misfit is rewritten once, then the reviewed fallback story. **GLM-5.3-Flash (the M0 pick) was dropped:** it reasons even with reasoning off and truncated the JSON.
- **Pictures:** FLUX.2-dev, 1024×768, prompt = the brand style block + the vetted look + the vetted scene, "absolutely no text". The cover is a portrait of the hero alone. **No reference image for the pages:** with one, FLUX.2 copied the cover's whole scene onto every page; the same character description and seed keep the hero consistent (checked by eye on 3 stories). The provider's NSFW checker stays on; **every picture is checked by Qwen3.5-9B** (serverless and multimodal; the Qwen-VL models are dedicated-only on Together): people, unsafe, sexual or **any writing** → redrawn once → Feelio stand-in. Pictures are drawn one request each, cover first then the pages in order (parallel requests hit 429; 429 waits and retries). About 7–25 s per picture, $0.0154 each.
- **Storage and access:** pictures and narration under `stories/<childId>/<storyId>/` in a private Blob store (`.data/` locally without a token), served only by child-scope routes after an ownership check. Deleted with the story, the profile or the account.
- **Caps (CR-11):** 3 new stories per child per family day; 1 newly narrated story per day (replays and its other pages free); `STORIES_ENABLED` and `VOICE_ENABLED` are the kill switches.
- **The book:** a two-page spread on wide screens with a 3D leaf that turns around the spine (RTL turns the other way), one page at a time on phones, cover → 4 pages → the end with the question; Feelio as narrator in the page's mood; "Read it to me" (Jessica, Multilingual v2, English only until an Arabic voice exists).
- **Parents:** a Stories tab per child lists titles, dates and themes, with Delete.

## D-071 Redesign v2: every page its own place, one AI notice where it matters
**Status:** accepted (owner brief and answers, 2026-10-12). Proposal: docs/REDESIGN_V2.md; art: ASSET_REQUESTS Batch 5.
- **Owner brief:** stop the speech bubble on every page, no blurred backgrounds, no repeated AI badges, each page its own visual identity; Story, Talk and Collection as distinct, creative experiences, like a polished children's game.
- **Owner answers:** the AI notice **stays on Talk and Story only** (one quiet line each); **build now, the art drops in**; the page concepts as proposed.
- **The AI notice (how SR-20 is now applied):** Feelio says it is an AI in its first words in onboarding (heard and shown); a single quiet line at the top of Talk ("Feelio is an AI, not a person") and of the story workshop ("Feelio, an AI friend, helps write these stories"); Feelio answers truthfully whenever asked (system prompt, unchanged). Removed: the wooden AI name sign on onboarding and on the not-set-up screen, the chip on the bookshelf and the byline in the storybook. SR-20's wording ("at onboarding, as a visible chip on the Talk and Story screens, and whenever the child asks") is still met; the mascot's accessible name still says "Feelio, a friendly AI". Legal note B8 is unchanged in substance (disclosure at first interaction).
- **Captions instead of bubbles:** `child/ui/Caption.tsx` shows Feelio's line in the form of the page (wooden sign plate on the map and in-world screens, glowing words in Talk, display titles in the theatre, library and treasure room), always with its audio and tap-to-replay. The bubble stays only in onboarding.
- **No blur anywhere in the child app:** the stories' blurred meadow is gone; the dock is a solid lilac tray (it was frosted glass).
- **Pages:** Talk is a dusk nook with Feelio's lamp and voice sparkles; the story workshop is a puppet theatre where the place is the backdrop, the hero stands in the spotlight, the feeling colours the lights, the adventure is the banner, and the curtains close while the story is written; the bookshelf is a library with books on wooden shelves; My collection is a treasure room with the child's character and a sticker album (stars per finished level, their story books, the feelings they met in stories), with page turns.
- **Data:** the collection reads only what other features already store (level progress, the child's stories and their chosen feeling); nothing new is kept (CR-6). The books page is hidden when the parent has Stories off.
- **Art:** each page uses its scene once both orientations are approved (`scene_talk_nook`, `scene_story_stage`, `scene_library`, `scene_treasure_room`, plus `ui_sticker_album_open`, `mascot_directing`, `mascot_holding_album`); until then flat brand colours and shapes, never a grey box or a blurred picture.
- **Not in this step:** the Calm sky and the night meadow for resting (proposal items 4).

## D-072 Batch 3–5 art delivered through a colleague's fork; reviewed here, not merged
**Status:** accepted (owner, 2026-10-13).
- **Source:** a colleague forked the repo (`Minyar-Meksi/new_feelio`, commit `0560529`) and generated 74 files with the OpenAI image tool via Codex, using our approved files as references (prompts and references kept in each manifest entry). The fork also added a `tmp/` folder (a vendored PDF library, compiled Python, generation scripts) and marked its own files approved (`reviewed_by: codex`).
- **What we took:** only the 74 image files, on a review branch. Not the `tmp/` folder and not the fork's manifest. Every file was viewed on a dark background and checked against the ASSET_PROTOCOL rejection list (writing, mascot drift, people, style, halo, cropping, subject, safety, frame alignment), plus measured size, alpha and edge contact.
- **Result:** 72 approved, logged with `reviewed_by: claude-code`. Notes: the School maps have tiny blurry chalkboard and poster marks inside a classroom window (no legible letters, kept); `level_school_3`'s "one chair apart" reads only weakly (kept). **2 sent back:** `mascot_speaking_closed` and `_open` were regenerated as whole pictures, so the body shifts against `mascot_speaking_half` and would shimmer when Talk swaps frames. New instructions: edit only the mouth with ChatGPT's Select brush. Talk shows the happy pose while speaking until they arrive.
- **Place maps:** the stones of the 8 new maps were measured from the art (stone-top colour, five ellipses per map, ordered as the levels go) and the path points moved onto them; each map's spare-space colour was measured from its edges. `provisional` is now false for every map except Home portrait (still a redo). Screenshots confirm the code-drawn stones sit on the painted ones in both orientations.
- **Layout fixes the art needed:** the album art keeps its 3:2 shape with the pages set inside its painted page area (one flat page on phones, where the landscape art would stretch); the Talk button label is outlined so it reads on the nook scene.
- **Test fixture:** `completedLevels` marks levels finished so later places can be opened in tests and screenshots.
