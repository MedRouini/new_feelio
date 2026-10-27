# Batch 8 (voice room): brief for Codex

You are making 10 images for Feelio, a children's app (ages 5–12). The job list is `assets/requests/batch8/jobs.json`. Follow this brief exactly.

## For each job, in the order of the list
1. Read the job: `asset_name`, `prompt`, `references`, `output_path`, `width`, `height`, `transparent_background`.
2. Generate the image with your image tool. **Attach every file in `references`**, and **use `prompt` word for word**. Ask for the highest quality.
3. Save it as a PNG at `output_path` (inside `assets/incoming/batch8/`).
   - If the tool returns another size with the **same shape** (for example a larger square), scale it to exactly `width` × `height`.
   - Never crop or stretch to a different shape. If the shape is wrong, generate again.
   - If `transparent_background` is true, the background must really be transparent: no white box and no fake checkerboard. If it isn't, generate again.
4. Look at the result before moving on. **Generate again if you see:**
   - any text, letters, numbers or writing-like scribbles
   - any person or human-like figure
   - something scary
   - a cut-off subject
   - a frame, button shape or background behind the object (it must be the object alone)
   - for mascot poses: any change to the character (antenna orb, screen face, sparkle eyes, pink cheeks, belly heart, colours, proportions); a mirrored or redrawn mascot; motion lines or air puffs
   - a style that doesn't match the references

## Check your work
Run `npx tsx scripts/check-incoming.ts batch8`. Every line must say `ok`. Fix any `FAIL` by generating that image again.

## Do not
- Write anything outside `assets/incoming/batch8/`: not `assets/approved/`, not `assets/manifest.json`, not code, not docs.
- Overwrite a file that already exists. Ask the owner first.
- Add helper folders, copied libraries, Python packages or scripts to the repository.
- Commit or push.

## When you are done
Write `assets/incoming/batch8/REPORT.md`: one line per asset, with the asset name, ok or the problem, and how many tries it took. Then tell the owner it's ready for Claude Code's review.
