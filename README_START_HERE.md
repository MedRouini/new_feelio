# Feelio kickoff kit: start here

## 1. Put your files in place (5 minutes)
| What | Where |
|---|---|
| Global map, vertical image | `assets/approved/map/global_vertical.png` (any of png/webp/jpg) |
| Global map, horizontal image | `assets/approved/map/global_horizontal.png` |
| Official mascot (transparent PNG, front view) and the 4 face templates, colourways | `brand/` |
| Wordmark / logo files and font licences | `brand/` |
| Brand presentation PDF | `brand/` |
| Legacy scenario artifacts (source) | `legacy/artifacts/` |
| Anthropic safety documents (optional; Claude Code can fetch them) | `docs/safety/` |

## 2. Add your keys (names only here, values in `.env` which is never committed)
ElevenLabs API key, Together AI API key. Auth keys come after Claude Code recommends a library. No Anthropic key.

## 3. Quick pre-tests (optional, 20 minutes)
Try one Arabic and one English sentence in the ElevenLabs agent you will use, check the voice quality, and note the credits used per minute.

## 4. Where everything goes
- Unzip. The folder `kit/` **is the project root**; rename it if you like (e.g. `feelio`). Open your terminal and run `claude` inside that folder.
- You do not install skills or MCP servers yourself. Claude Code installs the free ones it needs into `.claude/skills/` and `.mcp.json` in this folder, and lists them in `docs/TOOLS.md`. It will ask you before anything that needs a key or account.
- Keys go in a `.env` file at the project root (never committed).

## 5. Run Milestone 0
Open Claude Code in this folder, switch to plan mode, and paste the text in `KICKOFF_PROMPT.md` (below the line).

## 6. While it works: generate assets
Claude Code writes the prompts in `docs/ASSET_REQUESTS.md`. For each one: open ChatGPT, upload the listed reference images, paste the prompt, ask for a transparent PNG, save it under `assets/approved/...` with the filename given, and tell Claude Code it is delivered. Start with the mascot poses (Batch A).

## What is in this kit
- `CLAUDE.md`: rules Claude Code follows every session.
- `docs/SPEC.md`: what we are building.
- `docs/ASSET_PROTOCOL.md`: visuals are never drawn by Claude Code; it writes prompts, you generate.
- `docs/MASCOT.md`: the mascot as a Duolingo-style guide and the voice companion's body.
- `docs/MAP.md`: the interactive global map.
- `docs/ART_DIRECTION.md`, `docs/WORLD_PLAN.md`: style guide and future place maps.
- `brand/BRAND.md`: draft brand guide from the presentation (to verify).
- `KICKOFF_PROMPT.md`: the first message to paste.
