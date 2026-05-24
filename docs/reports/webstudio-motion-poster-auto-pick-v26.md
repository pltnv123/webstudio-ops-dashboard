# WebStudio Motion Poster Auto-Pick v26

Updated: 2026-05-24T21:01:53Z

## Goal
Avoid black/empty first frames in Ops Cockpit and client handoff.

## Algorithm
1. Sample candidate timestamps: `0.8, 1.2, 2.0, 3.2, 4.5, 6.0, 7.5`.
2. Extract JPG frames with ffmpeg.
3. Score by brightness and contrast.
4. Select highest score.
5. If selected frame is still dark, apply mild brightness/contrast/saturation correction.
6. Save poster + metadata JSON.

## Script
`/workspace/projects/webstudio-hyperframes-runtime/scripts/pick-poster.py`

## Example
```bash
python3 /workspace/projects/webstudio-hyperframes-runtime/scripts/pick-poster.py   /workspace/output/webstudio-premium-site-example-001-social-teaser-v1.mp4   -o /workspace/output/webstudio-premium-site-example-001-social-teaser-v26-poster.jpg   --metadata /workspace/output/webstudio-premium-site-example-001-social-teaser-v26-poster.json
```
