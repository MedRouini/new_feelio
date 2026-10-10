# Feelio

An emotionally intelligent AI companion for children aged 5–12, with a parent dashboard. English and Arabic.

> Development and invite-only pilot stage. **Synthetic data only** until paid plans with data-processing agreements exist. See `docs/PLAN.md` for status and `docs/SPEC.md` for scope.

## Run it locally
Requirements: Node 20.9+ (tested on Node 24), a Neon Postgres database (free tier).

```bash
npm install
cp .env.example .env        # then fill in the values (see the comments in the file)
npm run db:migrate          # creates the tables
npm run dev                 # builds web images from assets/approved, then starts Next.js
```

- Child app: http://localhost:3000
- Parent dashboard: http://dashboard.localhost:3000 (browsers resolve `*.localhost` automatically)

## Checks
```bash
npm run lint         # includes the rule that only safety/ may call AI providers
npm run typecheck
npm test             # unit + integration (integration uses DATABASE_URL with synthetic accounts and cleans up)
npm run test:e2e     # browser flow; needs `npm run dev` running and `npx playwright install chromium`
npm run build
```

## Where things are
| Path | What |
|---|---|
| `app/child`, `app/parent` | The two surfaces (routed by host in `proxy.ts`) |
| `auth/` | Better Auth config, guards (parent session + adult gate, child device keys) |
| `parent/` | Parent-scope operations (consent, children, devices, deletion) |
| `platform/` | Env, database schema and client, encryption, markets, retention, host routing |
| `design/` | Tokens (in `app/globals.css`) and shared components |
| `content/` | Data: markets (later: worlds, scenarios, safety resources) |
| `messages/` | English and Arabic strings |
| `assets/approved/` | Approved art (never edited). `scripts/build-assets.ts` makes web copies |
| `docs/` | Spec, plan, decisions, architecture, safety, privacy, legal notes, assets |

Rules for contributors (and Claude Code) are in `CLAUDE.md`.
