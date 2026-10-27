# Batch 11 (film sample "The Tower"): brief for Codex

You are making 12 film frames for Feelio, a children's app (ages 5–12). Each frame is one complete illustrated moment of a short animated film: the room, Feelio and Nori together in one picture, at the right size, with the right expression. The app later moves a camera over each picture and adds voices, so these must feel like stills from one gentle animated film. The job list is `assets/requests/batch11/jobs.json`.

## For each job, in the order of the list
1. Read the job: `asset_name`, `prompt`, `references`, `output_path`, `width`, `height`.
2. Generate the image with your image tool. **Attach every file in `references`**, and **use `prompt` word for word**. Ask for the highest quality.
3. Save it as a PNG at `output_path` (inside `assets/incoming/batch11/`), exactly 1536 × 1024.
   - If the tool returns another size with the **same 3:2 shape**, scale it to exactly 1536 × 1024.
   - Never crop or stretch to a different shape. If the shape is wrong, generate again.
   - These are full pictures with a background: **not** transparent.
4. Look at the result before moving on. **Generate again if you see:**
   - any text, letters, numbers, speech bubbles or writing-like scribbles (also on the blocks)
   - any extra character or person besides Feelio and Nori (frames 01, 02, 06 and a2 show Feelio only, with no Nori)
   - **Feelio changed** in any way: antenna with amber orb, dark-blue screen face with sparkle eyes, pink cheeks, pale belly heart, stubby arm-flaps and feet, amber → rose → purple colours, round proportions. A mirrored, simplified or redrawn Feelio is a fail.
   - **Nori changed:** hair, face, skin, lilac outfit, rose shoes or age must match the character sheet
   - a different room (furniture, colours or window not matching the attached bedroom)
   - wrong sizes: Feelio and Nori about the same height; blocks about the size of Feelio's hand
   - anything scary, violent or upsetting beyond a gentle children's film
   - a style that doesn't match the references
5. **Keep the 12 frames consistent with each other.** If frame 1 sets the light, rug and tower colours, keep them for the rest. Generate frames 01–06 first and compare them side by side before continuing.

## Update (2026-10-24): reference limit
- Every job now lists **at most 5** references (the image tool's limit). Attach them as separate files; **do not combine references into one sheet** (that shrinks Feelio's details).
- Frames 01 and 02 are kept: **don't redo or overwrite them.** Frame 01 is now a reference for frames 03–12, so the room, light, blocks and Feelio stay consistent across the film.
- Continue from frame 03.

## Check your work
Run `npx tsx scripts/check-incoming.ts batch11`. Every line must say `ok`. Fix any `FAIL` by generating that frame again.

## Do not
- Write anything outside `assets/incoming/batch11/`: not `assets/approved/`, not `assets/manifest.json`, not code, not docs.
- Overwrite a file that already exists. Ask the owner first.
- Add helper folders, copied libraries, Python packages or scripts to the repository.
- Commit or push.

## When you are done
Write `assets/incoming/batch11/REPORT.md`: one line per frame, with the asset name, ok or the problem, and how many tries it took. Then tell the owner it's ready for Claude Code's review.
