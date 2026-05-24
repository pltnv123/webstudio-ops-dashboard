# WebStudio Premium Motion Factory v26 Report

Updated: 2026-05-24T21:02:56Z

## Status
`PASS_LOCAL_READY_REPO_SYNC_PENDING_HOST_RUNNER`

## Repo sync decision
Meaningful repo changes are needed. The primary repo exists at `/workspace/tmp/webstudio-ops-dashboard-pr`; `/home/hermes/workspace/tmp/webstudio-ops-dashboard-pr` is not visible inside Docker. v25 MP4/output artifacts remain output-only because they are generated deliverables, not dashboard source. The repo should track:
- dashboard source for Premium Motion Factory status panel;
- docs/reports under `docs/reports`;
- host-runner autopush packet/status.

## Production generator
- generator spec: `/workspace/output/webstudio-motion-data-driven-generator-v26.md`
- schema: `/workspace/output/webstudio-motion-template-data-schema-v26.json`
- batch plan: `/workspace/output/webstudio-motion-batch-render-plan-v26.md`
- workflow: `/workspace/output/webstudio-motion-batch-render-workflow-v26.md`
- demo input: `/workspace/output/webstudio-motion-batch-render-demo-input-v26.json`

## Poster auto-pick
- script: `/workspace/projects/webstudio-hyperframes-runtime/scripts/pick-poster.py`
- social poster: `/workspace/output/webstudio-premium-site-example-001-social-teaser-v26-poster.jpg`
- hero poster: `/workspace/output/webstudio-premium-site-example-001-motion-preview-v26-poster.jpg`
- run log: `/workspace/output/webstudio-motion-poster-auto-pick-v26-run.log`

## Reduced motion / handoff
- fallback snippets: `/workspace/output/webstudio-reduced-motion-fallback-snippets-v26.md`
- handoff pack: `/workspace/output/webstudio-motion-client-handoff-pack-v26.md`

## D1/D2/D3
- D1: `/workspace/output/webstudio-d1-motion-bundle-v26.md`
- D2: `/workspace/output/webstudio-d2-motion-bundle-v26.md`
- D3: `/workspace/output/webstudio-d3-motion-bundle-v26.md`

## Video metadata
```json
[
  {
    "path": "/workspace/output/webstudio-hyperframes-smoke-v24.mp4",
    "exists": true,
    "size": 256259,
    "codec_name": "h264",
    "width": 1920,
    "height": 1080,
    "r_frame_rate": "30/1",
    "duration": "5.000000",
    "nb_frames": "150"
  },
  {
    "path": "/workspace/output/webstudio-premium-site-example-001-motion-preview-v2.mp4",
    "exists": true,
    "size": 1194043,
    "codec_name": "h264",
    "width": 1920,
    "height": 1080,
    "r_frame_rate": "30/1",
    "duration": "10.000000",
    "nb_frames": "300"
  },
  {
    "path": "/workspace/output/webstudio-premium-site-example-001-social-teaser-v1.mp4",
    "exists": true,
    "size": 856447,
    "codec_name": "h264",
    "width": 1080,
    "height": 1920,
    "r_frame_rate": "30/1",
    "duration": "9.000000",
    "nb_frames": "270"
  }
]
```
