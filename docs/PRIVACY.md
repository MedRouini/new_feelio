# Privacy design (DRAFT, Milestone 1)

> **Not a privacy policy and not a compliance statement.** It describes how Feelio is *designed* to handle data, so counsel can review it and turn it into public text. "Designed to support"; requires legal review (CLAUDE.md rule 5). Retention periods marked *proposed* await the owner's sign-off (open item in `docs/PLAN.md`).

## 1. Principles
- **Parents only have accounts.** Children have no credentials, no email and no real name in the system (SPEC §3.1).
- **Data minimisation (CR-6):** store only what a feature needs. No raw voice audio, ever. No conversation transcripts kept by Feelio.
- **Consent first:** a parent consents (market config `content/markets/baseline.json`) before any child profile can exist. The server enforces this in `parent/operations.ts` (`createChild` refuses without active consent; integration-tested).
- **Synthetic data only** on free tiers (Neon Free, Vercel Hobby) until paid plans with data-processing agreements exist (D-009, D-010, D-014).
- **Real deletion:** hard deletes that cascade, and crypto-shred for encrypted fields.

## 2. Data inventory (as built in Milestone 1)
| Data | Why | Where | Retention | Deletion path |
|---|---|---|---|---|
| Parent name, email, password hash (Better Auth `user`, `account`) | Parent sign-in | Neon Postgres, Frankfurt | Account lifetime | Account deletion (`deleteAccount`) cascades |
| Parent sessions (`session`: token, IP address, user agent) | Keep the parent signed in; security | Neon | Until expiry (1 day), then swept daily | Expiry + daily retention job; account deletion |
| Adult-gate passes (`adult_gate`) | Proof of a recent password re-check | Neon | 1 day | Daily retention job; cascades with session |
| Household (market, timezone, locale) | Market rules, local time for schedules | Neon | Account lifetime | Cascades with the account |
| Consent record (policy version, method, scopes, time) | Evidence of parental consent | Neon | Account lifetime; any legal hold to be set by counsel | Cascades with the account (counsel to confirm whether a hold is required) |
| Child profile: **optional nickname (AES-256-GCM encrypted)**, age band, language | Personalise in the child's language and age | Neon | Until the parent deletes it | `deleteChild`; account deletion; key rotation crypto-shreds nicknames |
| Child settings (features, limits, schedule, text size) | Server-side enforcement of parental controls | Neon | With the profile | Cascades |
| Progress (per level activity: ids, started or completed, a time), collection | Unlock the world; show which levels are in progress or done; show collected moments. No answers or choices are stored (D-056) | Neon | With the profile | Cascades |
| Usage ledger (minutes, tokens, credit estimates per day and feature) | Daily caps and budget meter (CR-11) | Neon | 90 days (*proposed*) | Daily retention job |
| Child device keys (Better Auth API keys: **SHA-256 hash**, first 7 characters, expiry, last use) | Child device sign-in without credentials | Neon | 30 days, or until revoked | Revoke; child or account deletion (explicit, no FK); daily sweep of expired keys |
| Audit log (parent setting changes) | Accountability, parent support | Neon | 1 year (*proposed*) | Daily retention job; cascades with the account |
| Rate-limit counters | Abuse protection on sign-in | Neon | 1 day | Daily retention job |
| Safety events (category, severity, actor class, feature, locale, time; no conversation, no audio) | Safety review; parent summaries (not for restricted events) | Neon | 90 days; restricted events 30 days unless escalated (approved D-058) | Daily retention job; cascades with the profile |
| Safety-event excerpts (redacted, at most 200 characters, AES-256-GCM) | Reviewing whether a high or medium event was real | Neon | 30 days (approved D-058) | Daily job deletes the ciphertext |
| Safety-event counts (day, category, severity, feature; no child) | Transparency reporting (SR-42) | Neon | Kept (no personal data) | n/a |
| Parent reports ("something felt wrong": category, optional note of up to 500 characters, redacted, encrypted) | Safety review (SR-43) | Neon | 90 days (D-066) | Daily retention job; cascades with the household |
| Voice sessions (child, household, conversation id, age band, locale, place, allowed seconds, adult-test flag, start and end; while the talk is open, the game being played as ids and numbers, cleared when it ends (D-077); **no words, no audio**) | Session gate, voice minutes, binding each turn (D-068); what Feelio knows about the game (D-077) | Neon | 90 days (*proposed*, awaiting the owner) | Daily retention job; cascades with the profile |
| Voice conversations at ElevenLabs (transcript while the call runs) | Speech to text and text to speech | ElevenLabs | Audio not recorded (`record_voice: false`, `delete_audio: true`); `retention_days: 0` (D-068). A data-processing agreement is needed before real children use it | Agent settings in `safety/voice-agent/sync.ts` |
| Household time zone and allowed hours | Enforcing the parent's daily limit and hours on the family's own clock | Neon | With the account | Cascades |
| *Planned (M5)*: voice audio and transcripts | Live conversation | Processed by ElevenLabs; **not stored by Feelio** | ElevenLabs minimal retention (configured per agent) | Provider deletion API where available |
| Stories (the 4 vetted choices as short labels, the checked story text, picture states, provenance; never the child's own words) | The child's bookshelf; the parent's Stories tab | Neon | **Until a parent deletes it** (owner decision 2026-10-11, D-070) | Parent dashboard → child → Stories → Delete; cascades with the profile and the account |
| Story pictures and narration audio | The storybook | Private Vercel Blob store (`.data/` in local development) | With the story | Deleted with the story, the profile or the account (`child/stories.ts`) |
| Story workshop slots (`story_draft`) | Making the next story | Neon | Until the story is made (then cleared) | Cascades with the profile |
| Picture prompts sent to the image provider (Together → the model's maker, third-party data sharing ON since 2026-10-11) | Drawing the pictures | Together / Black Forest Labs | Provider's terms | Vetted descriptions only: no child words, voice, name or identifier ever reach them (SR-19) |

**Cookies.** Parent session cookie: host-only on the dashboard host, httpOnly, Secure in production. Child device key: httpOnly, host-only on the child host, 30 days. Language: a non-secret preference cookie. No analytics, advertising or third-party cookies.

**Logs.** Application logs contain ids and counts, never child content or secrets. Vercel Hobby keeps runtime logs for 1 hour (D-010).

## 3. Where data is processed (subprocessors)
| Service | Role | Data | Location | Status |
|---|---|---|---|---|
| Vercel | Hosting, functions (region `fra1`) | All requests in transit | EU (Frankfurt) functions; global CDN for static files | Hobby: no DPA, so synthetic data only (D-010) |
| Neon | Postgres database | Everything in §2 | AWS eu-central-1 (Frankfurt) | DPA to confirm for the plan in use (D-014) |
| ElevenLabs *(M5)* | Voice agent: speech-to-text, text-to-speech | Live audio, transcripts (transient) | US by default | **Under-18 use needs written approval** (D-005) |
| Together AI *(M2+)* | LLMs, safety classifier, images | Prompts and outputs | US; no region choice | Zero data retention to be enabled; DPA via sales (D-009) |
| Email provider *(M1 open)* | Parent verification and safety notices | Parent email | To be chosen | Not chosen; ask the owner |
| Anthropic | n/a | None | n/a | **Not used** |

## 4. Parent rights (designed to support; legal review required)
- **See:** the dashboard shows each child's profile and devices (M1); activity insights come in M3.
- **Delete:** a child profile (M1, re-auth required), the whole account and all data (M1, re-auth required). Both are hard deletes, verified by integration and end-to-end tests.
- **Export:** M3 (open).
- **Withdraw consent:** the data model supports it (`consent_record.withdrawn_at`); the UI comes in M3.
- **Revoke devices** (M1).

## 5. Security measures (built in M1)
- Auth by Better Auth (maintained library, D-002). No custom password, session or token code.
- Separate scopes on separate hosts (D-032). A child key is never a session (integration-tested).
- Adult gate: a password re-check through Better Auth `verifyPassword`, valid 30 min for the area and 5 min for destructive actions.
- Secrets server-only, validated at start (`platform/env.ts`), never logged.
- Rate limits on sign-in and sign-up (stored in the database) and on child keys (300 requests/min).
- Field encryption for nicknames; device keys stored as hashes.
- Security headers (nosniff, frame denial, referrer policy, permissions policy).

## 6. Open items
- Retention numbers marked *proposed* need the owner's sign-off.
- Consent-record legal hold after account deletion: counsel.
- Email provider choice and its DPA.
- The child's right to be heard about their data at older ages (UK AADC / GDPR): counsel, M3.
