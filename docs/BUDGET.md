# Budget model (Milestone 0, 2026-10-10)

Tags: **[V]** verified on the provider's page today (URL in `docs/DECISIONS.md` D-012) · **[E]** my estimate or inference · **[?]** unknown, needs your answer or a measurement.

## 1. ElevenLabs: the scarce resource
### What the pricing says
- [V] Agents are priced per **call minute**. Plans and included minutes: Free 15 · Starter 75 · Creator 275 · Pro 1,238 · Scale 3,738 · Business 12,375. Extra minutes cost $0.08. **Burst** calls cost 2× ($0.16/min).
- [V] Billing is on connection time. **Silence longer than 10 s is billed at 5%.** `retranscribe_on_turn_timeout` cancels that discount, so keep it off.
- [V] Plan credit pools: Free 10k · Starter 30k · **Creator 121k** · Pro 600k.
- [V] TTS (for static audio): Multilingual v2 = 1 credit per character; Flash/Turbo v2.5 = 0.5–1 credit per character.
- [V] When a **custom LLM** is used, the agent sends LLM calls to our endpoint. The pass-through LLM charge applies only to ElevenLabs-hosted models. [E] So the LLM cost lands on Together, not on ElevenLabs credits.
- [?] The help page says Agents "are billed by call minutes, not by the shared credit pool," yet LLM pass-through is "deducted from your ElevenLabs credits." How your 120k credits convert to agent minutes is **not stated anywhere I could find**.

### Interpretation (owner confirmed 2026-10-10: **120k credits per month**)
This matches the **Creator plan (121k credits, 275 agent minutes per month)** [E]. Credits per agent minute implied by the plan ≈ **440** [E]. Still to check on your usage page: how many agent minutes it shows, so we know whether agent minutes and credits are one pool or two (open item).

### Monthly minutes
| Assumption | Billable minutes per month |
|---|---|
| Creator ratio, 440 credits/min, no silence discount | ≈ 272 [E] |
| Pro ratio, 485 credits/min | ≈ 247 [E] |
| 25% of connected time is long silence (> 10 s, billed at 5%) | ≈ 340 [E] |
| **Planning figure** (conservative) | **250** [E] |

### Monthly allocation
| Use | Month 1 | Month 2+ | Notes |
|---|---|---|---|
| Static audio: fixed phrases + crisis scripts, EN + AR | 15,000 | 1,000 | About 120 lines × 2 languages × about 90 chars ≈ 21.6k chars, generated **once** in month 1 and reviewed; Flash v2.5 (0.5 credit/char) for routine lines, Multilingual v2 or v3 for crisis lines. Month 2+ covers fixes only |
| Development and latency tests (adult testers) | 15,000 | 10,000 | ≈ 32 / 21 min |
| Story narration, starter library | 10,000 | 0 | About 5 reviewed starter stories × 4 pages × 250 chars × 2 languages. Narration of generated stories stays **off** |
| Scenario narration (static, later) | 0 | up to 10,000 | From Milestone 4, as scenarios get approved |
| **Voice conversations** | **80,000 ≈ 170 min** | **≈ 99,000 ≈ 210 min** | At about 470 credits/min. Adult testers now; children only after D-005 |
| **Total** | 120,000 | 120,000 | Unused credits are assumed **not** to roll over [?] |

### Caps and how many sessions that is (proposed caps, enforced in the session gate)
| Cap | Proposed value | Where |
|---|---|---|
| Hard session backstop | 300 s (`max_duration_seconds`) | Agent config |
| Our session limit (normal) | **4 min**, or 3 min in L1 thrifty mode | Session gate → proxy |
| Silence end-call | 30 s | Agent config |
| Per-child daily voice | **8 min** (2 sessions) | Session gate |
| Per-household daily voice | 12 min | Session gate |
| Global daily voice | 20 min during the pilot (≈ 9,400 credits) | Session gate + `call_limits.daily_limit` |
| Global budget floor | Below 15% of the allocation left → L1. Allocation spent → L2 (text + static audio) | Kill switch |
| Bursting | Off (`bursting_enabled: false`) | Agent config |

**Sessions supported** [E]: an average session of about 3.5 billed minutes (children often stop early; silence discount included):
- Month 1: 170 / 3.5 ≈ **48 sessions**.
- Month 2+: 210 / 3.5 ≈ **60 sessions per month**. For example 7 pilot children × about 2 sessions per week.

**What this means:** voice is a precious, short "talk with Feelio" moment, not an open-ended chat. The text chat (L2) is the always-available companion, and it costs no ElevenLabs credits.

## 2. Together AI (USD; owner has about **$50** of credits, 2026-10-10)
Prices [V] from together.ai/pricing (cross-checked with the docs models list):

| Use | Model | Price per 1M tokens (in / out) or per image |
|---|---|---|
| Voice replies | `Qwen/Qwen3.5-9B` (reasoning off) | $0.17 / $0.25 |
| Voice fallback | `meta-models/Muse-Glimmer-30B` | $0.35 / $1.50 |
| T1 safety classifier (text and image) | `Qwen/Qwen3.5-9B` | $0.17 / $0.25 |
| Stories | `zai-org/GLM-5.3-Flash` | $0.15 / $0.50 |
| Story illustrations | `black-forest-labs/FLUX.2-dev` | $0.0154/image ("varies") |
| Illustrations, quality step-up | `black-forest-labs/FLUX.2-pro` | $0.03/image ("varies") |

### Cost per voice minute (LLM side only) [E]
About 4 agent turns per minute.
- Generation: about 1,500 input tokens (system prompt + history) and about 60 output tokens per turn.
- Input classifier: about 600 in and 40 out per turn.
- Post-hoc output check: about 300 in per turn.

Total ≈ 9.6k input and 0.4k output tokens per minute ≈ **$0.0017 per minute**, or about $0.007 for a 4-minute session. Negligible next to ElevenLabs.

### Cost per story [E]
- Text: about 2k in and 2.5k out, doubled for reasoning and Arabic tokenisation ≈ $0.003.
- Safety checks on the request, the text and 5 image prompts ≈ $0.001.
- Images: 1 character reference + 4 pages = 5 × $0.0154 ≈ $0.077.
- Vision check of 4 images ≈ $0.001.
- About 20% regeneration overhead.

| Image model | Cost per story |
|---|---|
| FLUX.2-dev | **≈ $0.10** |
| FLUX.2-pro | ≈ $0.19 |

### How the $50 is split (proposal)
| Use | Allocation | What it buys [E] |
|---|---|---|
| Model benchmarks (voice and story candidates, EN + AR) and red-team runs | $8 | A 400-case red-team run costs ≈ $0.05 on Qwen3.5-9B, so about 100 runs, plus benchmarks |
| Voice LLM + classifier (≈ $0.002/min) | $3 | ≈ 1,500 voice minutes, far more than ElevenLabs allows |
| Text companion (L2, no voice) | $4 | ≈ 2,000 text sessions |
| **Stories** (≈ $0.10 each with FLUX.2-dev) | $25 | ≈ 250 stories, including the M5 evaluation (3 image models × 20 stories ≈ $8) |
| Reserve | $10 | Retries, regenerations, surprises |

Caps that make it last the pilot: **2 generated stories per child per day**, **40 stories per month globally** during the pilot, image regenerations limited to 1 per page, and a **global Together spend meter** that switches stories to the starter library (L3) at 80% of the month's allocation. The `$50` is a balance, not a monthly grant, so the meter counts against the remaining balance [E: please tell me if you top up monthly].

### Other
- Rate limits: [V] none are published (best-effort serverless, 429 or 503 under load), so the client retries with backoff and degrades to L3.
- Billing: [V] minimum top-up $15, no free trial.

## 3. Vercel Hobby [V]
Included each month: 1M invocations, 4 h Active CPU (time spent waiting on I/O, such as an LLM stream, doesn't count), 100 GB Fast Data Transfer, 5,000 image transformations.

[E] A 4-minute voice session is about 16 proxy invocations, so 1,000 sessions is about 16k invocations, far below the limit. Map images are served pre-built (our own WebP and AVIF, not Vercel image optimisation), so transformations are unaffected.

**Main risk: the terms, not the limits** (non-commercial, no DPA; D-010).

## 4. Effort and cost per world pack (SPEC §4.4) [E]
| Item | Effort | Credits or USD |
|---|---|---|
| Map art: 2 orientations + blank-sign edits + rejections | 3–5 h of owner time in ChatGPT | ChatGPT subscription only |
| Pack style addendum + regional reviewers | 2–4 h writing + reviewer time | Reviewer fees [?] |
| Cast sheet (if new characters) | 3–6 h owner time | n/a |
| Scenarios: 5 places × 5 levels × 2 = 50 | Writing or migrating ≈ 50 × 30 min; EN↔AR translation; expert and regional review ≈ 50 × 20 min | Review fees [?] |
| Scenario narration (static audio, EN + AR) | Generation + review | ≈ 50 × 300 chars × 2 = 30k chars → **15k–30k ElevenLabs credits**: the largest cost of a pack. Consider narration only for ages 5–8, or text plus mascot audio cues |
| Code | None (data and assets only) | n/a |

## 5. Developer usage report (SPEC §3.2)
`/dev/usage` (development only) reads `usage_ledger` and the ElevenLabs post-call `call_duration_secs`. It shows credits and minutes per session, per child (pseudonymous), per feature and per day, Together tokens and images, and the remaining allocation for each line in §1.

## Measured in Milestone 2 (2026-10-11)
- One full red-team run (765 inputs + 26 outputs, classifier on Together) costs about $0.10. Rules-only runs are free and run in CI.
- A strict voice turn makes 1 model call plus 1 + (sentences) classifier calls: roughly 1,500 to 2,500 Together tokens, about $0.0005 per turn. Voice credits (ElevenLabs) were not used.
