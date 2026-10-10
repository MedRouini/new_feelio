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
**Status:** proposed · 2026-10-10

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
**Status:** **blocked: owner action** · 2026-10-10
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
**Status:** proposed, needs your confirmation · 2026-10-10
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
**Status:** **needs your decision** (changes a safety check described in SPEC §3.1) · 2026-10-10
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
**Status:** **needs your action** · 2026-10-10

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
**Status:** proposed · 2026-10-10
- **Neon free tier:** plain Postgres, 1 GB per project, 100 CU-hours, scale-to-zero after 5 minutes (cold start on the first query), branches for previews, Vercel integration.
- **Supabase free tier:** 500 MB and pauses after a week of inactivity. It is mainly useful with Supabase Auth, which we're not using.
- Synthetic data only until a paid plan with a DPA.
- **Sources:** neon.com/pricing; neon.com/docs/introduction/regions; supabase.com/pricing (read 2026-10-10).

## D-015 Story characters default to animals or creatures (proposal)
**Status:** needs your decision · 2026-10-10
- Generating images of human children is the riskiest generative surface (SR-01, T3).
- Defaulting story characters to friendly animals or creatures, in the brand style, removes most of that risk and helps consistency.
- Human characters could come later only from the approved cast sheet.

## D-016 Scripts language
**Status:** needs your decision (low priority) · 2026-10-10
- SPEC names `scripts/sync_voice_agent.py`. The local Python is 3.8 (end of life).
- Proposal: write the sync script in TypeScript (`scripts/sync-voice-agent.ts`, run with `tsx`) using `@elevenlabs/elevenlabs-js`, so there's one toolchain. Same behaviour: the repo config is the source of truth, there's a dry-run diff, and CI fails if the live agent drifts.
- Alternative: keep Python, which needs Python ≥ 3.10.

## D-017 Repository initialised in Milestone 0
**Status:** done · 2026-10-10
- The folder was not a git repository. I ran `git init`, added a `.gitignore` (`.env*` except `.env.example`, `node_modules`, `.playwright-mcp/`, build output), and committed the Milestone 0 docs on branch `milestone-0`.
- No remote was added. Pushing is your call.
