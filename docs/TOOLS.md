# Tooling log (skills, plugins, MCP servers)

Rules (CLAUDE.md "Tooling"): free only, reputable sources only, project scope only (`.claude/skills/`, `.mcp.json`), read before installing, no art or image-generation skills, no real child data to any third-party tool. Anything that needs a key, an account, or sends data to a third party waits for the owner's yes.

Checked on 2026-10-10. Local environment: Claude Code 2.1.296, Node v24.19.0, Python 3.8.0 (end of life; some skills need Python 3.9 or 3.10+).

## Installed (project scope)
| Name | Source | Version | Why | Access | Remove |
|---|---|---|---|---|---|
| Playwright MCP | https://github.com/microsoft/playwright-mcp (npm `@playwright/mcp`, Apache-2.0, integrity `sha512-oNcl+Ae2…`) | **0.0.83** (pinned) | Lets Claude Code open the app, take screenshots in both orientations, EN and AR, and check its own UI and RTL | Launches a headless Chromium in an in-memory profile (`--isolated`). Navigation limited by `--allowed-origins` to `localhost:3000` and `127.0.0.1:3000` (the README says this is **not a security boundary**). Writes screenshots to `.playwright-mcp/` (git-ignored). Downloads the browser from Microsoft's CDN on first run. No key, no telemetry found. `--block-service-workers` is on now and will be removed when we test the PWA service worker | Delete the `playwright` entry from `.mcp.json`, or `claude mcp remove playwright -s project` |
| `child-safety-review` (project skill, written by us) | `.claude/skills/child-safety-review/SKILL.md` | v1 (2026-10-10) | Checklist before every milestone commit (CLAUDE.md rules + `docs/SAFETY_POLICY.md`) | Instructions only, no scripts | Delete the folder |
| `asset-request` (project skill, written by us) | `.claude/skills/asset-request/SKILL.md` | v1 | Request format and rejection checklist from `docs/ASSET_PROTOCOL.md` | Instructions only | Delete the folder |
| `rtl-i18n-check` (project skill, written by us) | `.claude/skills/rtl-i18n-check/SKILL.md` | v1 | EN/AR strings, mirroring rules, never mirror the mascot | Instructions only | Delete the folder |

Claude Code asks you to approve project MCP servers in `.mcp.json` the first time it uses them.

## Evaluated, not installed

### Free with no key, but deliberately not installed
| Name | Source / version | Reason |
|---|---|---|
| `frontend-design` skill | anthropics/skills @ `dbd4588f` (Apache-2.0); also already active in this environment as the `frontend-design` plugin from anthropics/claude-plugins-official | It pushes "aesthetic risk" and inventing a palette. That conflicts with brand fidelity (CR-7) and the asset protocol (CR-10). A repo copy would add a second trigger. **Rule for this project:** where it is active, `brand/BRAND.md` and `docs/ASSET_PROTOCOL.md` override it, and it must never be used to draw assets |
| `webapp-testing` skill | anthropics/skills @ `dbd4588f` | Needs Python ≥ 3.9 and Python Playwright. Its `with_server.py` runs arbitrary shell commands. Duplicates Playwright MCP and the Node `@playwright/test` we'll use in Milestone 1 |
| `skill-creator` skill | anthropics/skills @ `dbd4588f` | Already available in this environment. Its scripts need Python ≥ 3.10 and spend tokens through `claude -p` |
| `mcp-builder` skill | anthropics/skills @ `dbd4588f` | Its eval scripts need `ANTHROPIC_API_KEY`, which is forbidden (no Anthropic key) |
| next-devtools-mcp | github.com/vercel/next-devtools-mcp, npm 0.4.0 (MIT) | Useful only with a running **Next.js 16+** dev server. Sends telemetry to `telemetry.nextjs.org` unless `NEXT_TELEMETRY_DISABLED=1`. **Plan:** install in Milestone 1 after scaffolding, pinned, with telemetry off: `{"command":"cmd","args":["/c","npx","-y","next-devtools-mcp@0.4.0"],"env":{"NEXT_TELEMETRY_DISABLED":"1"}}`. Ignore its suggestion to install a global browser CLI |
| Art, design and image skills (canvas-design, algorithmic-art, theme-factory, slack-gif-creator, web-artifacts-builder, brand-guidelines) | anthropics/skills | Forbidden (asset protocol) or irrelevant |

### Needs your yes (key, account, or data to a third party)
| Name | Source / version | Needs | Sends data | My recommendation |
|---|---|---|---|---|
| Together AI docs MCP | `https://docs.together.ai/mcp` (official, HTTP) | No key | Doc search queries to Together's docs host | **Yes, recommended.** Only our questions about the docs leave the machine. Install: `claude mcp add --scope project --transport http together-docs https://docs.together.ai/mcp` |
| Context7 | github.com/upstash/context7, npm 4.3.0 (MIT); `https://mcp.context7.com/mcp` | Key optional (free account raises limits) | Library names and queries to Upstash | Optional. Without it, current docs come from the vendors' `llms.txt` files (`elevenlabs.io/docs/llms.txt`, `docs.together.ai/llms.txt`, `nextjs.org/docs/llms.txt`), which already worked in Milestone 0 |
| Vercel MCP | `https://mcp.vercel.com` (OAuth) | Vercel account | Full account powers, including deploy and **purchases** | Not now. Revisit at deployment (Milestone 1), and if so with deploy and purchase tools set to ask |
| GitHub MCP | github/github-mcp-server v2.0.2 | PAT or OAuth | GitHub | Not needed: the `gh` CLI covers it. This folder is not a git repo yet (see `docs/PLAN.md`) |
| ElevenLabs CLI `@elevenlabs/cli` 1.4.0 | github.com/elevenlabs/cli | Browser OAuth login | ElevenLabs | Not needed: SPEC requires `scripts/sync_voice_agent.py` through the API, which uses the existing key server-side. Could replace it later if you prefer |
| ElevenLabs MCP (local, deprecated; or hosted `api.elevenlabs.io/v1/mcp`) | elevenlabs/elevenlabs-mcp 0.12.2 | API key or OAuth | ElevenLabs | **Do not install.** It spends the scarce credits, can modify or delete the agent and its safety-proxy config (a CR-1 bypass), can read conversation transcripts (future child data), and can place outbound calls or clone voices |

## Other tools used in Milestone 0 (not installed in the project)
- **PyMuPDF 1.23.26**, installed only into the session scratchpad (not the repo) to render the brand PDF and read its vector fill colours. Nothing to remove from the project.
