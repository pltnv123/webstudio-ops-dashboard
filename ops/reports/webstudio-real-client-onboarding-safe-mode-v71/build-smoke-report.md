## node syntax
## py compile
## npm build

> webstudio-ops-dashboard@0.1.0 build
> python3 scripts/build_snapshot.py --dist /workspace/output/webstudio-ops-dashboard-static

snapshot=/workspace/projects/webstudio-ops-dashboard-v70-work/public/data/webstudio-control-plane-state.json size=3662253 sha256=e05ab98e59007d11ec400cfb13e69eb265b36d37b2982e89372317eecc6fb50c
canonical=/workspace/output/webstudio-control-plane-state.json size=3662253 sha256=e05ab98e59007d11ec400cfb13e69eb265b36d37b2982e89372317eecc6fb50c
snapshot_publish=FALLBACK warning=Live snapshot rejected; published last valid snapshot fallback instead. fallback_source=/workspace/output/webstudio-control-plane-state.json
candidate_errors=["kanban.task_total is zero while a last valid snapshot exists"]
safety=pass mirror_executable_count=0 duplicate_keys=0
dist=/workspace/output/webstudio-ops-dashboard-static files=185
npm notice
npm notice New major version of npm available! 10.8.2 -> 11.17.0
npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.17.0
npm notice To update run: npm install -g npm@11.17.0
npm notice
## npm smoke

> webstudio-ops-dashboard@0.1.0 smoke
> python3 scripts/smoke_check.py

SMOKE PASS
generated_at=2026-06-15T23:18:56Z
kanban_task_total=852
wf_completed=144
routes=overview,work-factory,premium-factory,kanban,production,d3-intake,owner-feedback,clients,sales-pack,real-assets,asset-intake-pack,proposal-quote,integration-plan,real-client-onboarding,bot-activity,route-health,approvals,health,artifacts,marathon,audit
executable_mirror_count=0
npm notice
npm notice New major version of npm available! 10.8.2 -> 11.17.0
npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.17.0
npm notice To update run: npm install -g npm@11.17.0
npm notice
