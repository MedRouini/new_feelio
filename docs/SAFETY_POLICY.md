# Feelio safety policy (DRAFT v0.1, Milestone 0)

> **Status: DRAFT, not reviewed.** Needs review by a child-protection or safeguarding expert, a child psychologist, and counsel before the pilot. Nothing here is a legal or compliance claim (CLAUDE.md rule 5). Wherever this document says the product does something, read it as "is designed to"; nothing is built yet.
> Sources are saved in `docs/safety/` (retrieved 2026-10-10). Live pages are authoritative.

## 0. How the sources bind us
| Source | Short code | Status for Feelio today |
|---|---|---|
| Anthropic, *Child safety guidance for developers* (updated 2026-06-26) | **CSG** | **Adopted standard.** Scoped to products on Anthropic's API. Feelio uses no Anthropic model, so it does not bind us legally or contractually. We follow it as if it did (SPEC §2). It becomes **binding** the day Claude is used anywhere a child interacts with it. |
| Anthropic, *Guidelines for organizations serving minors* (updated 2026-03-16) | **OSM** | Same: adopted standard now, binding if Claude is added. |
| Anthropic, *Aligning on child safety principles* (2024-04-23) | **ACP** | Context. Anthropic's own Safety by Design commitments, used as a checklist. |
| Thorn / All Tech Is Human, *Safety by Design for Generative AI* | **SbD** | Adopted framework (CSG recommends it). |
| `CLAUDE.md` non-negotiable rules | **CR-n** | **Binding** internal rules |
| `docs/SPEC.md` | **SPEC §** | **Binding** product requirements |
| Law (COPPA, GDPR Art. 8, UK AADC, 18 U.S.C. §2258A, local law) | **LAW** | Binding where it applies. Counsel must confirm per market (`docs/LEGAL_NOTES.md`, Milestone 1) |

Gaps in the Anthropic documents: they focus on CSAM, grooming, sextortion, AI disclosure, moderation and compliance. They say **nothing** about self-harm, abuse disclosure, emotional dependency, parental involvement or crisis handling. For those, this policy follows the SPEC §6 protocol table. Each such requirement is marked **[expert review]**, because it rests on our own judgement rather than a cited standard.

## 1. Requirements (numbered, traced)
Each line: **ID, requirement, source(s), how it binds us, where it is enforced.**

### A. Prohibited content and conduct (hard rules)
| ID | Requirement | Source | Binds | Enforced in |
|---|---|---|---|---|
| SR-01 | Never generate, store, display or transmit sexual content of any kind. Sexualisation of minors (including fiction and role-play) is a hard block in every feature, including image prompts and generated images | CSG "Your obligations" (Usage Policy: CSAM, sexualising minors "in any context, including fiction or roleplay"); SPEC §6 | Adopted + SPEC | `safety/` input and output checks, image prompt builder, image classifier |
| SR-02 | Never facilitate grooming, trafficking, sextortion or exploitation. Detect grooming patterns in the child's speech (secrets with adults, requests for photos, moving to other apps, gifts) and respond with the reviewed protocol | CSG obligations; SPEC §6 | Adopted + SPEC | Classifier taxonomy, crisis router |
| SR-03 | Assume people will try to misuse the product. Safeguards must work against deliberate attempts, not only accidents (jailbreaks, role-play framing, misspellings, transliterated Arabic) | CSG obligations ("expect that end users may…"); SPEC §6 test suite | Adopted | Red-team suite in CI |
| SR-04 | Violent or frightening content: age-appropriate limits, no graphic detail. Calm redirection, no lecturing | SPEC §6 | SPEC | Age-band system prompts, output check |
| SR-05 | Harmful or dangerous requests: calm redirection with an alternative activity | SPEC §6 | SPEC | Router → reviewed redirect lines |

### B. Detection, moderation and the pipeline
| ID | Requirement | Source | Binds | Enforced in |
|---|---|---|---|---|
| SR-10 | Content moderation and filtering on **all** model inputs and outputs: voice transcripts, text chat, story requests and text, image prompts, generated images, AI-drafted scenario content | OSM §1; ACP Deploy; CR-1; SPEC §6 | Adopted + binding | `safety/` (the only path to any model) |
| SR-11 | Feature code never calls a model provider directly. The voice agent reaches the LLM only through our safety proxy | CR-1; SPEC §5.1 | Binding | Lint rule + code review: provider SDKs importable only from `safety/` |
| SR-12 | A child-safety system prompt on every model call (age band, boundaries, language). If Claude is ever added and Anthropic publishes a child-safety system prompt, adopt it | OSM §1; SPEC §6 | Adopted | `safety/prompts/` (versioned, reviewed) |
| SR-13 | Provider safety measures are not enough on their own. Our own checks run even where the provider has filters (e.g. the image NSFW checker) | OSM §1 ("not infallible… in conjunction with the organization's own safety features") | Adopted | Defence in depth (§3) |
| SR-14 | When a check fails, the child gets a reviewed fallback, never raw model output and never an error state | SPEC §5.1 and §6; CR-12 (no failure states) | SPEC | Fallback library |
| SR-15 | Crisis resources live in a reviewed per-locale data file and are never generated by a model | SPEC §6 | SPEC | `content/safety/resources.<locale>.json` |
| SR-16 | Fixed crisis scripts are pre-generated static audio, reviewed and served as files | CR-11; SPEC §3.2 | Binding | `public/audio/safety/` |
| SR-17 | Red-team test set: child-style inputs with misspellings, ASR errors, English, Arabic (script and Arabizi), expected outcomes, run in CI, pass rates reported. A release does not ship if any hard-block case regresses | CSG obligations; SPEC §6; ACP Develop (stress-testing); SbD Develop | Adopted + SPEC | `safety/tests/redteam/` |
| SR-18 | No user uploads of images, audio or video; no user-to-user messaging; no public sharing. This removes most CSAM-ingestion surfaces | CR-9; CSG Detection (scope depends on surfaces) | Binding | Architecture |
| SR-19 | Story illustrations: prompts are assembled from templates and vetted fields, never passed through from the child's words. A cartoon style is forced. The NSFW checker stays on. Every generated image gets a second check before display | CSG obligations; SPEC §5.2; SR-01 | Adopted + SPEC | `stories/` → `safety/images` |

### C. Disclosure, education and the companion's boundaries
| ID | Requirement | Source | Binds | Enforced in |
|---|---|---|---|---|
| SR-20 | Users are told they are interacting with an AI, not a human, in child-friendly words and visuals: at onboarding, as a visible chip on the Talk and Story screens, and whenever the child asks | OSM §3 ("must disclose"); CR-8; SPEC §6 | Adopted (OSM's strongest wording) + binding | UI chip with `mascot_head_happy`, onboarding, system prompt |
| SR-21 | The companion never claims or implies being human or "a secret friend", and refuses honestly and kindly | SPEC §5.1 and §6 | SPEC | System prompt + output check (human-claim patterns) |
| SR-22 | Never diagnose or label mental-health conditions | SPEC §5.1 | SPEC | System prompt + output check |
| SR-23 | Never encourage dependency or secrecy. Affirm real-world relationships and point back to trusted adults regularly. No guilt-tripping and no pleas to stay | SPEC §5.1 and §6; CR-12 **[expert review]** | SPEC | System prompt, output check, dependency signals (§4.5) |
| SR-24 | Educational resources: a safe-use guide for parents and a child-friendly version in the app | OSM §1; SPEC §5.4 | Adopted | Parent dashboard + child "How Feelio works" |
| SR-25 | Personal information (address, school, full name, phone): gently discourage sharing, and redact before anything is stored | SPEC §6; CR-6 | SPEC | PII detector before storage and logging |

### D. Access, age and consent
| ID | Requirement | Source | Binds | Enforced in |
|---|---|---|---|---|
| SR-30 | Only intended users can reach the product: children only through a device a verified parent has authorised; adults only through a parent account plus re-authentication plus the adult gate | OSM §1 ("age verification systems"); SPEC §3.1 and §5.4 | Adopted + SPEC | Auth scopes (`docs/ARCHITECTURE.md` §6) |
| SR-31 | Verifiable parental consent before any child data is collected. The method is chosen per market in configuration | SPEC §1 and §7; LAW (COPPA) | SPEC + LAW (counsel) | Consent flow (Milestone 1) |
| SR-32 | Parental settings, time limits, schedules and feature permissions are enforced on the server, including when a voice session token is issued | CR-2; SPEC §5.4 | Binding | Session gate |

### E. Monitoring, reporting and records
| ID | Requirement | Source | Binds | Enforced in |
|---|---|---|---|---|
| SR-40 | Monitoring process for safety events, with a **named owner** and a review cadence (proposal: daily during the pilot, weekly after) | OSM §1 ("monitoring and reporting mechanisms"); CSG ("detection, reporting, and response infrastructure"); SPEC §6 | Adopted + SPEC | Safety review queue (dev and admin only) |
| SR-41 | A reporting procedure for apparent CSAM or child exploitation. **US:** a provider with actual knowledge must report to the NCMEC CyberTipline (18 U.S.C. §2258A; register at esp.ncmec.org). **Other markets:** national hotline and legal duty via the INHOPE directory. Do not keep or display the material beyond what the procedure requires. Counsel review | CSG Reporting; LAW; SPEC §6 | Adopted + LAW | `docs/REPORTING_PROCEDURE.md` (Milestone 2) |
| SR-42 | Aggregate counts of safety events by category for transparency reporting, with no child content kept beyond the safety-event retention period | CSG ("logging for transparency reporting"); SPEC §6 | Adopted | `safety_event_counts` table |
| SR-43 | A way for parents (and children, in child terms) to flag "something felt wrong", which feeds the same review queue | ACP Deploy (user reporting); SbD Deploy | Adopted | Parent dashboard + child "tell a grown-up" button |
| SR-44 | Phased rollout with early abuse monitoring: an invite-only pilot first | ACP Deploy; SPEC §1 | Adopted | `docs/PLAN.md` |
| SR-45 | Safety by Design: write down how each phase (develop, deploy, maintain) is handled (§6 below) | CSG; SPEC §6 | Adopted | This document |
| SR-46 | Join or consult Tech Coalition **Pathways** (free). Eligibility is uncertain because we host no user content; contact md@technologycoalition.org. Record any hash-matching or classifier vendor decision | CSG Program development; SPEC §6 | Adopted (next step) | `docs/DECISIONS.md` |

### F. Law and public statements
| ID | Requirement | Source | Binds | Enforced in |
|---|---|---|---|---|
| SR-50 | Comply with applicable child-safety and privacy law (e.g. COPPA) | OSM §2; CSG obligations | Adopted + LAW | `docs/LEGAL_NOTES.md` + counsel |
| SR-51 | OSM §2 asks for compliance to be "clearly stated on the organization's website." **Deferred:** CR-5 forbids compliance statements until counsel has reviewed them. Not a live conflict, because OSM does not bind us today. If Claude is added, this becomes a pre-launch blocker that needs counsel | OSM §2 vs CR-5 | Conflict, flagged (D-013) | n/a |

### G. Crisis and sensitive situations: SPEC §6 protocols (each needs a defined response, an escalation path and tests)
| ID | Situation | Response (reviewed fixed script + static audio) | Escalation | Parent sees |
|---|---|---|---|---|
| SR-60 | Self-harm or suicidal ideation **[expert review]** | Stay warm, take it seriously, "tell a grown-up right now," show the locale crisis line on screen. Mascot `calm` | Safety event, severity high, enters the review queue | Calm summary and next steps, **immediately** |
| SR-61 | Immediate danger (fire, injury, someone hurting them now) | "Go to a grown-up now or call [local emergency number]," with the number shown large. Session stays open, no further chatter | Safety event, high | Immediately |
| SR-62 | Abuse disclosure **[expert review]** | §5 below | §5 | **Depends on who the alleged actor is** (§5) |
| SR-63 | Sexualisation of minors, grooming, sextortion | Hard block, reviewed fixed response ("That's not okay, and it's not your fault. Tell a grown-up you trust."), resources. Grooming or sextortion by a third party also shows locale reporting help (US: NCMEC "Take It Down" and CyberTipline). Mascot `calm` | Safety event, high, plus the SR-41 procedure if exploitation material or apparent exploitation is involved | Yes, unless the actor is in the household (§5) |
| SR-64 | Sexual content (child asks) | Neutral redirect, no shaming | Event, low | Aggregate only |
| SR-65 | Emotional dependency signals ("you're my only friend," daily very long sessions) **[expert review]** | Affirm real relationships, suggest an offline activity, shorten the session, never shame | Event, low; repeated → medium | Gentle summary ("Feelio encouraged time with friends") |
| SR-66 | Pretend to be human or a "secret friend" | Honest, kind refusal | None | No |
| SR-67 | PII shared | Gentle "let's keep that private"; redact | None (aggregate count) | No |

## 2. Safety layer design
### 2.1 One entry point
`safety/` is the only module allowed to import provider SDKs (Together, ElevenLabs server API). Its public surface is a small set of functions:
`checkInput(ctx, text)`, `generate(ctx, request)` (prompt assembly, model call, streamed output check), `checkImagePrompt`, `checkImage`, `classifyTranscript` (post-call). `ctx` carries `{childId (pseudonymous), ageBand, locale, feature, placeId, sessionId}`. It never carries a name, school or anything else identifying.

### 2.2 Pipeline (SPEC §6)
```
input ─▶ normalise ─▶ T0 rules ─▶ T1 classifier ─▶ policy router ─▶ generation (age-band + child-safety prompt)
                          │              │                │                     │
                          └── crisis hit ┴──▶ fixed script │         streamed sentences ─▶ T0 output rules ─▶ [T1 output check] ─▶ child
                                                           └──▶ redirect / block / crisis
```
- **Normalise:** Unicode NFKC, casing, Arabic normalisation (strip diacritics, unify alef, yaa and taa marbuta forms), an Arabizi (Latin-letter Arabic) transliteration pass, leetspeak, and common ASR confusions.
- **T0 rules (≤ 5 ms, deterministic, high recall):** reviewed multilingual phrase lists and patterns for crisis (self-harm, abuse disclosure, immediate danger), sexual terms, grooming markers ("keep it secret," "send a photo," "meet me"), PII (phone, email, address shapes), human-claim and dependency phrasing in outputs. A T0 crisis hit **short-circuits**: the reviewed script plays without waiting for any model.
- **T1 classifier (LLM, structured JSON):** Together has no moderation model on serverless today (verified 2026-10-10: "There are currently no moderation models offered via serverless"; Llama-Guard-4-12B removed 2026-08-25). **Proposal (D-008):** a small fast instruct model (`Qwen/Qwen3.5-9B`, reasoning off) prompted with **our** child-safety taxonomy and returning `{category, severity, actor_class, confidence}` through `json_schema`. It is less proven than a purpose-built guard model, so it is scored on our red-team set before it is trusted, with a minimum recall bar on every high-severity category. Alternatives needing your decision: a second moderation provider, or a dedicated guard endpoint (billed by GPU-hour).
- **Policy router:** a reviewed table `(category, severity, actor_class, ageBand, locale) → action`. Actions: `allow`, `allow+steer` (add a system note such as "the child is sad; empathise, suggest one coping step"), `redirect` (reviewed line), `crisis(script_id, resources)`, `block+event`.
- **Generation:** age-band system prompt (5–6, 7–9, 10–12), the Feelio persona (`brand/BRAND.md` §7), the child-safety rules (SR-20 to SR-25), a hard limit of 1–2 sentences for voice, and the language.
- **Output check:** see §3, the latency trade-off.
- **Fallbacks:** each category has 3–5 reviewed fallback lines per language and age band, chosen at random so they don't sound robotic. They are also static audio where used in voice.

### 2.3 Taxonomy (v0)
`ok · sad_or_worried · anger · sexual · sexual_minor · grooming · sextortion · self_harm · suicide · abuse_disclosure · immediate_danger · violence_graphic · dangerous_activity · hate_or_bullying · pii · dependency · human_claim_probe · jailbreak · medical_or_diagnosis · off_topic_adult`. Severity: 0–3. `actor_class` (for disclosures only): `household_caregiver · other_known_adult · peer · stranger_online · stranger_offline · unknown`.

## 3. Latency versus safety in the voice proxy (the decision to review)
The voice turn budget (SPEC target ≤ 2 s from end of speech to first audio) has to cover: ElevenLabs end-of-turn detection, the hop to our Vercel function (region `iad1` by default, single region on Hobby), our input checks, model time to first token, the first complete sentence, our output check, and ElevenLabs TTS time to first audio. Only our hop and our checks are ours to optimise.

**Options compared (estimates, to be measured in Milestone 4):**
| Design | Added latency | Safety | Notes |
|---|---|---|---|
| A. Serial: T0 → T1 → generate → T1 per sentence | ≈ +0.5–1.5 s per check | Highest | Likely blows the 2 s budget |
| **B. Parallel and gated (proposed):** T0 synchronous; T1 on the input runs **in parallel** with generation; generated tokens are **held** until T1 returns; then each sentence passes T0 output rules before release | ≈ max(T1, first sentence) − first sentence, often near 0; T0 ≈ 5 ms | High: no output reaches the child before the input verdict; output gets deterministic checks | Wasted tokens when T1 blocks (rare, cheap) |
| C. B plus a synchronous T1 check of the **first** sentence | ≈ +0.3–0.8 s | Higher | Optional "strict mode" per age band or market |
| D. Output checked only after the fact | 0 | Lowest | Rejected: an unsafe sentence could be spoken |

**Proposal:** B by default, with **C switchable** in configuration (e.g. on for ages 5–6 or for a market) and turned on automatically for the rest of a session once any medium-or-higher event occurs. The whole reply also gets an asynchronous T1 check after it is spoken. Its verdict feeds the next turn's steering, logging and the post-call second pass. Short replies (1–2 sentences) reduce the window for unsafe content. **Residual risk:** with B alone, a harmful output sentence that T0 rules miss can be spoken once. C closes that gap at a latency cost. I want your call on the default (open question Q3).

Also: crisis turns are **faster** than normal ones, because a T0 hit plays a static file with no model in the loop.

## 4. Specific protocols
### 4.1 Crisis output path
The router picks `script_id`. The proxy returns the script text, so the agent speaks it. (Whether ElevenLabs can play our static file directly instead of synthesising it is still being verified; see `docs/DECISIONS.md` D-004.) The client is told to show the resources card (client tool `show_safety_resources`), and the mascot is forced into `calm` or `empathy`. The model is not called for the rest of that turn.

### 4.2 Images (stories)
Prompt builder (templates only) → T0 and T1 on the assembled prompt → provider NSFW checker on (HTTP 422 = block) → a vision check of the generated image (`Qwen/Qwen3.5-9B` is a vision-capable model, to evaluate) → display. Any block regenerates once with a safer template, then falls back to a pre-approved illustration. **Recommendation (Q8):** story characters default to animals or friendly creatures, not human children. This removes most of the risk of generating images of minors.

### 4.3 Post-call second pass
The ElevenLabs post-call webhook (HMAC verified) sends the transcript. It is classified, safety events are written with minimal fields, and the transcript is then **discarded**: never stored in full and never audio (CR-6).

### 4.4 Text fallback
When voice is unavailable (budget, schedule, outage), text chat uses the identical pipeline.

### 4.5 Dependency signals
Inputs: phrase patterns ("only friend," "love you more than my mum"), time-on-companion patterns, late-night attempts outside the schedule. Responses scale gently. Never a hard cut-off framed as punishment.

## 5. Abuse disclosure when a parent may be involved **[expert review: highest priority]**
**The problem.** SPEC says: notify the parent dashboard *unless the parent may be the source*. The only adult who has an account is the parent. Telling that parent about a disclosure that implicates them can put the child at risk (retaliation, pressure to take it back) and can taint any later investigation.

**What the companion does in every disclosure (whoever the actor is):**
1. **Believe and reassure:** "Thank you for telling me. It's not your fault. You deserve to be safe."
2. **No investigating:** no "who? when? where exactly?" questions. Leading questions belong to trained professionals and can harm later child-protection interviews. At most one open, gentle prompt ("Do you want to tell me more?") is allowed.
3. **No secrecy promises either way:** never "I won't tell anyone," never "I'm going to tell your mum."
4. **Encourage a trusted adult** outside the situation: a teacher, school counsellor, another family member. Also the **locale child helpline** on screen (from the reviewed resources file).
5. **Discreet display:** the resources card is calm, not a loud alert, and has a "hide" button, since the child may be watched.
6. Mascot `empathy` or `calm`. No cheerful states for the rest of the session.

**Who is told (proposal):**
| actor_class | Parent dashboard | Restricted safety review |
|---|---|---|
| `stranger_online`, `stranger_offline`, `peer`, `other_known_adult` | **Yes:** calm summary ("Your child shared something worrying about [category], not about you. Feelio encouraged them to talk to a trusted adult and showed [helpline]. Suggested next steps…") | Logged |
| `household_caregiver` or `unknown` | **No notification** | **Yes:** a restricted event visible only to the named safety lead, minimal fields (category, actor_class, timestamp, locale, a redacted excerpt of at most 200 characters, encrypted), auto-deleted after 30 days unless escalated |

`unknown` is grouped with household on purpose. Ambiguous cases ("he hurts me") must not tip off a possible abuser.

**What the safety lead can do (pilot):** we hold no child name, address or school (data minimisation), so we cannot contact the child or the authorities about a specific child the way a school could. The realistic actions are: (a) set the companion to show helpline resources at the start of that child's next sessions; (b) where the law creates a duty or a clear imminent risk exists, consult counsel or the local child-protection hotline on what can lawfully be shared; (c) in apparent-exploitation cases, follow SR-41. **This limitation must be stated honestly in the tester consent form:** "Feelio is not an emergency or child-protection service."

**Tensions that need expert and counsel input (open question Q2):**
- **The parent's right to access their child's data** (COPPA parental review; GDPR Art. 15) could reveal a restricted event. Possible ground: GDPR Art. 15(4) and similar exceptions for other people's rights and safety. Counsel must confirm per market.
- **Transparency:** the pilot consent form should state, at policy level, that "if a child discloses possible harm by a household member, we may not notify the account holder." Parents enrolling know the rule, and no single parent is deceived about a specific event.
- **False positives:** children role-play and exaggerate. That argues for human review rather than automatic action.
- **Who the safety lead is:** a named person (probably you during the pilot) with a review cadence. Ideally trained in safeguarding.

## 6. Safety by Design (SbD) by phase
| Phase | SbD principle | How Feelio addresses it |
|---|---|---|
| Develop | Responsibly source training data | We train no models. We choose hosted models whose providers publish such commitments; to verify per model (D-008) |
| Develop | Feedback loops and stress-testing | Red-team suite in CI (SR-17); every safety event review feeds new test cases |
| Develop | Content provenance with misuse in mind | Generated story images carry metadata (model, prompt hash, date) in our records. No public sharing (CR-9) |
| Deploy | Safeguard products from abusive content and conduct | §2 pipeline on all inputs and outputs; no uploads or user-to-user features; user flagging (SR-43) |
| Deploy | Responsibly host models | Hosted providers only; zero-retention settings where offered (Together ZDR, ElevenLabs retention settings) |
| Deploy | Developer ownership of safety | This policy; the `child-safety-review` skill runs before every milestone commit |
| Maintain | Prevent services from scaling access to harmful tools | Per-child caps, rate limits, kill switches; no free-text image prompts |
| Maintain | Invest in research and future solutions | Track guard-model availability (Together dropped Llama Guard); re-evaluate quarterly |
| Maintain | Fight CSAM, AIG-CSAM and CSEM on the platform | SR-01, SR-19, SR-41 reporting procedure; Pathways consultation (SR-46) |

## 7. Retention of safety data (proposal, needs your approval because it changes what is stored)
| Data | Kept | Deletion |
|---|---|---|
| Safety event (category, severity, actor_class, timestamp, feature) | 90 days | Hard delete by daily cron (Hobby cron runs at most once a day) |
| Redacted excerpt (≤ 200 chars, encrypted) | 30 days unless escalated | Crypto-shred |
| Restricted (household) event | 30 days unless escalated | Crypto-shred |
| Aggregate counts | Indefinite, no child content | n/a |
| Full transcripts, audio | **Never stored** | n/a |
| Apparent CSAM | Only as the reporting procedure and law require (e.g. §2258A preservation) | Per procedure, counsel-reviewed |

## 8. Spec items that conflict with or go beyond the guidance (flags)
1. **SPEC §3.1 assumes a "Together-hosted safety model (Llama Guard-class)."** None exists on Together serverless today (verified 2026-10-10). Replaced by the D-008 proposal. Your decision is needed because this changes a safety check (CLAUDE.md workflow).
2. **OSM §2 public compliance statement vs CR-5:** deferred (SR-51, D-013).
3. **OSM §1 "age verification"** is written for keeping minors *out*. For Feelio, the intended users *are* minors, so we read it as "only authorised children, through a verified parent," and add the adult gate for the parent area. Consistent with the guidance in spirit; worth noting.
4. **SPEC §5.2 story illustrations of children:** generating images that depict children is the main SR-01 exposure. The guidance doesn't forbid it, but it is the riskiest generative surface we have. Hence Q8 (animal or creature characters).
5. **SPEC §5.1 crisis resources "through a client tool":** if only the LLM can trigger client tools, a crisis display would depend on the model. Our proxy must trigger it deterministically. To verify in the ElevenLabs docs (D-004).
6. **Provider terms and children:** Together's privacy policy says its services are "not directed to… anyone under 13." Nothing covers a business customer whose end users are children. Written confirmation and a DPA are needed before any real child data (D-009). ElevenLabs is being verified.
7. The Anthropic guidance does not cover crisis, dependency or disclosure. Our protocols there are expert-review items, not traced standards.

## 9. Testing (Milestone 2 deliverable)
- Red-team set v0: at least 400 cases. Each SR-60 to SR-67 category in EN and AR (script and Arabizi), with misspellings, ASR-style errors, role-play wrappers and multi-turn grooming patterns. Benign look-alikes ("I'm dying to go to the park," "kill the lights") to measure false positives.
- Metrics: recall per high-severity category (target 100% on the reviewed set, any miss blocks release), false-positive rate on benign cases, added latency p50 and p95.
- Every safety event reviewed in the pilot adds a test case.
