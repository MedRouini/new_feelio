# Legacy scenario artifacts (drop zone)

Put the source of the old scenario prototypes (Claude artifacts: `.html`, `.jsx`, `.tsx`, `.md`, or exported text) in this folder, one file per artifact, as they are.

What happens next (Milestone 4, `docs/ARCHITECTURE.md` §11, D-026):
- Claude Code **reads** each file (it never runs it) and extracts only the content: situation, question, choices, feedback.
- It writes `content/worlds/base/scenarios/<id>.json` in the scenario schema, with `review_status: draft`.
- It lists every change and every dropped item in `content/migration-report.md`.

Nothing here ships to children. Only expert-reviewed scenarios do.
