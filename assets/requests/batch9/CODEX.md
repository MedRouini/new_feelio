# Batch 9 (The Tower, Home level 3): brief for Codex

Make the four requested Nori images for Feelio, ages 5–12, in jobs.json order. Read docs/ASSET_PROTOCOL.md, docs/ART_DIRECTION.md, brand/BRAND.md and The Tower section of docs/SEL_ADVENTURES.md first.

## For each job
1. Read asset_name, used_for, prompt, references, output_path, final_path, size, width, height and transparent_background. Width and height retain batch8 checker compatibility; size is 1024x1024.
2. Use the image tool, attach every reference, use prompt word for word and ask for highest quality.
3. Save PNG only at output_path. Larger square outputs may be scaled down to 1024x1024; never crop or stretch a different shape. Regenerate wrong shapes or fake transparency.
4. Inspect before continuing. Reject text, letters, numbers, scribbles, logos, watermarks, emoji, extra characters, any Feelio mascot, frightening or violent content, cultural symbols, brand clothing, cropped subjects, backgrounds, frames, canvas shadows, halos or white fringes, wrong poses or mismatched style.
5. cast_nori_sheet intentionally contains front and three-quarter views of the same child. Every subsequent image contains one Nori and uses that sheet as its identity reference. Keep hair, outfit, colours and proportions identical; keep the three poses at the same scale, camera, facing direction and invisible ground line. Nori is an explicitly requested human supporting character; do not copy batch8's no-people rejection rule.

## Check your work
Run npx tsx scripts/check-incoming.ts batch9. Every asset must say ok. Regenerate failures. Visual identity and style review remains required beyond this mechanical check.

## Do not
- Write outside assets/requests/batch9/ and assets/incoming/batch9/. Request files are explicitly authorized; do not modify code, docs, assets/approved/ or assets/manifest.json.
- Overwrite existing files, add helper scripts or packages, commit or push.

## Finish
Write assets/incoming/batch9/REPORT.md with one line per asset: name, ok or problem, and tries. Tell the owner it is ready for review. These are incoming candidates, not approved assets.
