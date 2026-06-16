# Build / Smoke Report — WebStudio V2.7

Status: PASS

## Commands

- `python3 -m py_compile scripts/build_snapshot.py scripts/smoke_check.py`: PASS
- `npm run build`: PASS
- `npm run smoke`: PASS
- local static smoke `/bot-activity/`: PASS HTTP 200
- local static state JSON: PASS HTTP 200
- changed-files scan: PASS
- allowlist: PASS
- `git diff --check`: PASS

## Evidence

- build log: `/workspace/output/webstudio-live-bot-activity-feed-v27/npm-build-after-secretlabel.log`
- smoke log: `/workspace/output/webstudio-live-bot-activity-feed-v27/npm-smoke-after-secretlabel.log`
- static smoke log: `/workspace/output/webstudio-live-bot-activity-feed-v27/static-smoke.log`
- changed files: `/workspace/output/webstudio-live-bot-activity-feed-v27/changed-files.txt`
