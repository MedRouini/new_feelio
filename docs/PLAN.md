# Plan and milestone status

## Status
| Milestone | Status |
|---|---|
| **0 Discovery and plan** | **Done, awaiting owner approval** (2026-10-10) |
| 1 Foundation | Not started (waiting for approval) |

## Milestone 0 outputs
- `brand/BRAND.md` (DRAFT v2: verified against files, gaps filled, every statement tagged [P], [F] or [I])
- `docs/ASSET_REQUESTS.md` (Batch 1, 30 entries in priority order)
- `docs/ARCHITECTURE.md` (modules, Mermaid diagram, voice gate and proxy, map and `world.json`, PWA, mascot state machine, auth, data model, degradation, threat model, scenario schema and migration, credentials)
- `docs/SAFETY_POLICY.md` (draft: traced requirements, pipeline, latency trade-off, abuse-disclosure protocol)
- `docs/BUDGET.md`, `docs/DECISIONS.md` (D-001 to D-017), `docs/TOOLS.md`
- `docs/safety/` (saved Anthropic documents and Anthropic's child-safety principles)
- `.claude/skills/` (`child-safety-review`, `asset-request`, `rtl-i18n-check`), `.mcp.json` (Playwright MCP 0.0.83)

### Verified by running something
- **Brand palette:** read the vector fill colours out of the brand PDF (PyMuPDF). All 8 palette hex values match exactly.
- **Brand SVGs:** extracted colours and gradient stops. Found the amber logo variant uses `#FFB703`, with an inconsistent heart colour.
- **Contrast:** computed the WCAG ratio for every text and background pair.
- **Images:** checked every PNG's dimensions and alpha. The official mascot's alpha touches the right edge.
- **Viewed:** every brand image, the full presentation, and both maps with a measurement grid. Hotspot, pad, sign and path positions were measured by eye on that grid (±0.02).
- **Provider facts:** read today on the official pages by research agents. I re-checked the two most decisive ones myself with `curl`: Together's "no moderation models offered via serverless", and the ElevenLabs under-18 clause.
- **Playwright MCP 0.0.83:** metadata confirmed on npm.

### Only written, not run
- Everything in ARCHITECTURE, SAFETY_POLICY and BUDGET is design. Latency, Arabic quality, classifier recall and credits per minute are **estimates until M2 and M4 measure them**.
- Playwright MCP is configured but not yet started: no app exists, and Claude Code asks you to approve project MCP servers the first time.
- **Lint, typecheck, tests:** not applicable. There is no code in Milestone 0.

## Milestone review: proposed order (changes to SPEC §9)
| # | Milestone | Change and reason |
|---|---|---|
| 0 | Discovery and plan | Done |
| **P** | **Owner track (starts now, runs in parallel)** | **New.** Before any real child uses the product: ElevenLabs written approval (D-005), Together confirmation and DPA (D-009), font licences (D-011), counsel review of LEGAL_NOTES, a safeguarding expert for SAFETY_POLICY §5, and Batch 1 assets |
| 1 | Foundation | Unchanged. Add `docs/LEGAL_NOTES.md`, `docs/PRIVACY.md` drafts, and next-devtools-mcp |
| 1b | Global map and mascot shell | Unchanged (needs Batch 1 P1 assets, otherwise it can't close without placeholders). *Stop for review* |
| 2 | Safety layer + test suite **+ voice-proxy spike** | **Add a thin, adult-only spike** of the ElevenLabs custom LLM → our proxy → Together, with no UI. It answers the open questions (client tools from the proxy, the conversation-id header, latency budget, first-token timeout) before M3 and M4 build on them. *Stop for review* |
| 3 | Parent dashboard | Unchanged (the session gate depends on settings) |
| **4** | **Scenarios and games** (was 6) | **Moved earlier.** Authored content uses no generative credits, isn't blocked by provider approvals, and gives the map shell its playable levels, so the core loop is real sooner. Migrates the legacy artifacts once they're delivered (the folder is empty today) |
| **5** | **Companion: text first, then voice** (was 4) | Text companion (L2) first: same safety pipeline, works without ElevenLabs approval. Then voice (session gate, proxy, agent as code, crisis handling). Real-child voice stays behind the D-005 approval flag. *Stop for review* |
| 6 | Storybook generator (was 5) | After scenarios. Depends on D-015 (characters) and the image-model evaluation |
| 7 | Hardening | Unchanged. *Final review* |

Review stops (SPEC: after 0, 1b, 2, 4 and the end) follow the content: after 0, 1b, 2, **5 (voice)**, and the end.

## Open questions (ranked by how much they block)
1. **Q1 ElevenLabs approval (D-005), blocks voice with children.** Will you request ElevenLabs' written approval for an under-18 product? Until then, are you comfortable with adult-only development and testing of the voice agent?
2. **Q2 Abuse disclosure when the parent may be involved** (SAFETY_POLICY §5). Do you accept: no parent notification when the actor is a household member or unknown; a restricted review queue with **you** as the named safety lead (daily review during the pilot); and a consent-form clause saying so? Do you have access to a safeguarding expert and counsel to review it?
3. **Q3 Proxy latency vs safety** (SAFETY_POLICY §3). Default to design B (parallel input check, gated release, rule-based output checks, async full check), with strict mode C on for ages 5–6 and after any event? Or strict C everywhere at about +0.3–0.8 s per turn?
4. **Q4 Your ElevenLabs plan.** Which plan is it, is the 120k monthly or one-off, and how many agent minutes does your usage page show? This changes the budget (BUDGET §1).
5. **Q5 Together AI credit amount**, so I can set the global story and LLM caps. Also: please turn on zero data retention in the Together dashboard (D-009).
6. **Q6 Safety classifier (D-008).** Together has no Llama Guard any more. Approve the LLM classifier with our taxonomy, or do you want me to research a separate moderation provider (a new service)?
7. **Q7 Map signs and RTL (D-006).** Approve the blank-sign edits with code-drawn names, and mirroring the horizontal map in Arabic? Also: "Home" vs "House", and is the school's red pennant OK?
8. **Q8 Story characters (D-015).** Animals or creatures by default instead of human children?
9. **Q9 Brand items** (BRAND.md §10): colourways (B1), amber logo hex (B2), fonts (B3 / D-011: buy the FF Yaseer web licence? Which option for Dreaming Outloud?), tagline (B4), voice and tone and UI tokens (B5), Arabic register (B6), mascot PNG re-export (B7). **And approve BRAND.md v2.**
10. **Q10 Auth and data stack:** approve Better Auth + Neon (D-002, D-014)? The email provider for OTP and magic links will be a separate question in M1.
11. **Q11 Data retention proposals** (ARCHITECTURE §7, SAFETY_POLICY §7): approve or edit the numbers.
12. **Q12 Caps** (BUDGET §1): 4-minute sessions, 8 min/day per child, 20 min/day globally during the pilot, 3 stories per child per day. OK?
13. **Q13 Tools needing your yes** (TOOLS.md): the Together docs MCP (recommended); Context7, Vercel and GitHub MCPs (not needed now). I recommend never installing the ElevenLabs MCP.
14. **Q14 Legacy scenarios:** `legacy/artifacts/` is empty. When will you add them? M4 (scenarios) needs them.
15. **Q15 Accounts you'll need to create** (when ready): Neon (DATABASE_URL), a Vercel project. Rename `global_horizental.png` whenever convenient.
16. **Q16 Sync script in TypeScript instead of Python** (D-016)?
