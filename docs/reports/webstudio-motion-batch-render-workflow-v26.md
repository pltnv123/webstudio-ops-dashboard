# WebStudio Motion Batch Render Workflow v26

Updated: 2026-05-24T21:01:53Z

## Input
- `/workspace/output/webstudio-motion-batch-render-demo-input-v26.json`
- selected motion style
- selected HyperFrames template pack

## Output contract
- `16:9` hero video
- `9:16` social teaser
- proof cards reel
- process explainer
- posters/thumbnails
- render metadata
- QA report
- handoff packet

## Production workflow
1. `validate_brief`: schema + proof policy + rights state.
2. `select_style`: map use case/channel to motion style.
3. `instantiate_templates`: create composition data per output.
4. `lint`: HyperFrames lint for generated compositions.
5. `render_subset`: one hero/social asset with `--workers 1 --no-browser-gpu`.
6. `poster_pick`: pick non-black poster frame.
7. `metadata`: ffprobe codec/resolution/fps/duration/frames/size.
8. `qa`: browser/cockpit panel, video existence, scoped redaction scan.
9. `handoff`: owner/client pack with paths, commands, status, usage channel, next action.

## Demo subset result
For v26 the safe subset validates existing Example #001 assets and regenerates poster metadata instead of rendering heavy duplicate video.
