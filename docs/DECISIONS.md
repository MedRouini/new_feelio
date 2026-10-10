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
