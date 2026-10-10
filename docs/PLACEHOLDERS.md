# Placeholders

Every `TODO(PLACEHOLDER)` in code or UI is listed here. A milestone with open entries is not done (CLAUDE.md rule 4).

## Open
_None._ Milestone 1 uses only delivered, approved assets. No grey placeholder boxes are rendered.

## Not placeholders, but known gaps (documented, not faked)
| Gap | Where | Why | Unblocks when |
|---|---|---|---|
| Parent email verification is off (`REQUIRE_EMAIL_VERIFICATION=false`) | `auth/server.ts` | No email provider chosen yet (a new third-party service needs the owner's approval) | The owner picks a provider |
| Child home shows a greeting instead of the world map | `app/child/page.tsx` | The map is Milestone 1b | Milestone 1b |
