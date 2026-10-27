# Batch 10 (The Tower, Home level 3: the rest): brief for Codex

Make the ten requested images (two Nori poses, the tower, blocks, storm cloud and four choice pictures) for Feelio, ages 5–12, in jobs.json order. Read docs/ASSET_PROTOCOL.md, docs/ART_DIRECTION.md, brand/BRAND.md and The Tower section of docs/SEL_ADVENTURES.md first.

## For each job
1. Read asset_name, used_for, prompt, references, output_path, final_path, size, width, height and transparent_background. Width and height retain batch8 checker compatibility; size is 1024x1024.
2. Use the image tool, attach every reference, use prompt word for word and ask for highest quality.
3. Save PNG only at output_path. Larger square outputs may be scaled down to 1024x1024; never crop or stretch a different shape. Regenerate wrong shapes or fake transparency.
4. Inspect before continuing. Reject text, letters, numbers, scribbles, logos, watermarks, emoji, extra characters, any Feelio mascot, frightening or violent content, cultural symbols, brand clothing, cropped subjects, backgrounds, frames, canvas shadows, halos or white fringes, wrong poses or mismatched style.
5. The two cast_nori jobs contain one Nori each and use the approved cast_nori_sheet and cast_nori_idle as identity references. Keep hair, outfit, colours and proportions identical; keep them at the same scale, camera, facing direction and invisible ground line. Nori is an explicitly requested human supporting character; every other job (props, storm cloud, choice pictures) must have no people and no faces.

## Check your work
Run npx tsx scripts/check-incoming.ts batch10. Every asset must say ok. Regenerate failures. Visual identity and style review remains required beyond this mechanical check.

## Do not
- Write outside assets/requests/batch10/ and assets/incoming/batch10/. Request files are explicitly authorized; do not modify code, docs, assets/approved/ or assets/manifest.json.
- Overwrite existing files, add helper scripts or packages, commit or push.

## Finish
Write assets/incoming/batch10/REPORT.md with one line per asset: name, ok or problem, and tries. Tell the owner it is ready for review. These are incoming candidates, not approved assets.
