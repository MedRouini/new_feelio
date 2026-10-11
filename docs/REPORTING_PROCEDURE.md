# Reporting procedure: apparent child sexual abuse material or exploitation (SR-41)

> **Status: DRAFT v0.1 (2026-10-11), not reviewed.** Needs counsel's review before any real child uses Feelio, and before it is relied on. Nothing here is a legal or compliance claim (CLAUDE.md rule 5). It describes how Feelio is *designed to support* the duties below; counsel confirms what applies in each market.

## 1. Why this exists
- Anthropic's child-safety guidance asks for detection, reporting and response infrastructure. Feelio adopts it as its standard (SAFETY_POLICY §0).
- In the US, a provider with actual knowledge of apparent child sexual abuse material (CSAM) must report it to NCMEC's CyberTipline (18 U.S.C. §2258A). Other countries have their own hotlines and duties, listed in the INHOPE directory. Markets are not chosen yet (SPEC §8).

## 2. What Feelio can and cannot see (design facts)
- **No uploads.** Children and parents cannot upload images, video or audio (CR-9, SR-18). Feelio holds no user-supplied media in which CSAM could appear.
- **No user-to-user contact and no public sharing (CR-9),** so there is no channel for adults to reach children through Feelio.
- **Generated images** (stories, Milestone 6) are built from templates, never from the child's words. The provider's NSFW checker stays on, and every image gets a second check before display (SR-19). A blocked image is not stored.
- **What we can learn:** a child may *tell* Feelio about exploitation happening elsewhere ("a man online asked for photos"). The safety layer treats this as a crisis:
  - the reviewed exploitation script
  - "tell a grown-up you trust"
  - reporting help in child terms
  - a restricted or high safety event (SAFETY_POLICY §4–5)
- **What we hold about a child:** no name (unless a parent typed a nickname, encrypted), no address, no school, no contact details (data minimisation, CR-6). We usually cannot identify or locate the child, or the person they describe.

## 3. The procedure
**Who:** the named safety lead (the owner during the pilot, D-019). The safety lead reviews high and restricted safety events at the agreed cadence: daily in the pilot (SR-40).

1. **Detection.** A safety event with category `sexual_minor`, `grooming` or `sextortion` and level `high` enters the review queue. Restricted events (a possible household actor) are visible only to the safety lead (SAFETY_POLICY §5).
2. **First look, within one working day.** Read only the minimal fields: category, actor class, time, locale, and the redacted excerpt of at most 200 characters, encrypted and deleted after 30 days. Decide:
   - (a) **false alarm:** role-play, a misheard word. Mark it reviewed, and add a red-team case if the system was wrong.
   - (b) **a child describing exploitation by someone outside Feelio:** go to step 3.
   - (c) **apparent CSAM inside a Feelio system:** for example, a generated image that slipped past both checks. Go to step 4.
3. **A child's disclosure (b):**
   - Mark the event `escalated`, so it is kept beyond the normal retention while it is handled.
   - Turn on resources for that child's next sessions (SAFETY_POLICY §5, action a).
   - Consult the local child-protection hotline and counsel on what may lawfully be shared and whether any duty to report applies. Where there is a clear risk of imminent harm, contact the emergency services with whatever information is lawfully available.
   - Never contact the account holder about a restricted event (§5).
   - Record what was done, when, and on whose advice (no child content) in the safety log.
4. **Apparent CSAM inside Feelio (c):**
   - Do not view it beyond what is needed to confirm. Do not copy, forward or download it.
   - **US:** report to the NCMEC CyberTipline (report.cybertip.org; providers register an ESP account at esp.ncmec.org) and preserve as §2258A requires (counsel to confirm the current preservation period).
   - **Other markets:** the national hotline from the INHOPE directory (inhope.org), and counsel.
   - Disable the generation path that produced it (global kill switch, ARCHITECTURE §9) until the cause is fixed. Add a test.
   - Delete the material once the procedure and the law allow it, and record that it was deleted.
5. **Afterwards:** update the red-team suite and, if needed, the rules and the routing table; re-run the suite (D-022). Keep only the aggregate count (SR-42).

## 4. What we never do
- Keep or show the material beyond what the procedure and the law require.
- Investigate the child: no questions about who, when or where (SAFETY_POLICY §5).
- Promise the child secrecy, or tell them we will inform their parents.
- Make a public statement about a case.

## 5. Open items (before the pilot)
- [ ] Counsel review of this procedure for the first market(s).
- [ ] Register an NCMEC ESP account if the US is a market. Identify the national hotline for each other market.
- [ ] Tech Coalition Pathways consultation (SR-46).
- [ ] A qualified safeguarding review of the crisis scripts and of SAFETY_POLICY §5 (D-019 gate).
- [ ] A review screen for the safety lead. Milestone 3, with the parent dashboard. Until then: a database query, run by the owner only.
