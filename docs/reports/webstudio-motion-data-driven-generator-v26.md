# WebStudio Motion Data-Driven Generator v26

Updated: 2026-05-24T21:01:53Z

## Status
Production design: **READY**. Heavy batch rendering remains gated by stable `--workers 1 --no-browser-gpu`.

## Purpose
Turn a client brief into repeatable motion assets:

`client brief JSON → motion style → template data → batch render → posters → QA sheet → handoff bundle`

## Required input
- product/service name
- offer headline, subheadline, primary value, scope
- proof points with evidence status
- objections + answers
- CTA text/destination/approval state
- brand/style direction: palette, tone, forbidden visuals, assets
- motion style from library
- formats: `16:9`, `9:16`, `1:1`
- duration + FPS
- output type: hero video, social teaser, proof reel, process explainer

Schema: `/workspace/output/webstudio-motion-template-data-schema-v26.json`.

## Generator decisions
1. Reject fake proof: proof status must be `verified`, `client_provided`, or clearly `placeholder_for_owner_review`.
2. Select motion style by channel.
3. Instantiate template with safe copy, exact CTA, and no unapproved logos/claims.
4. Render with HyperFrames, then verify MP4 via ffprobe.
5. Generate poster by auto-picking non-black frame.
6. Create QA sheet and client handoff pack.

## Production outputs
- MP4 video(s)
- poster JPG/PNG per MP4
- render metadata JSON
- QA markdown
- source composition path
- handoff markdown/zip manifest
