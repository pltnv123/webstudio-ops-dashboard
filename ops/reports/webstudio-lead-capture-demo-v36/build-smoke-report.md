# WebStudio V3.6 Build / Smoke Report

Status: PASS

## Commands
- `npm run build`: PASS
- `npm run smoke`: PASS
- `git diff --check`: PASS
- local static smoke `/lead-capture-demo/`: PASS
- changed diff secret scan: PASS

## Local static route
- File: `/workspace/output/webstudio-ops-dashboard-static/lead-capture-demo/index.html`
- SHA256: `7d73f9e3ede6e2cf49eb31a7a1f05897d13237b8297791807866d0f9c7478844`
- Markers: `PASS`

## Build tail
```text

> webstudio-ops-dashboard@0.1.0 build
> python3 scripts/build_snapshot.py --dist /workspace/output/webstudio-ops-dashboard-static

snapshot=/workspace/tmp/webstudio-ops-dashboard-pr/public/data/webstudio-control-plane-state.json size=3582105 sha256=cd07cdb845ee3eb75bcf0efff56fc252e8291c78d5c116c21bd75684c4cf0745
canonical=/workspace/output/webstudio-control-plane-state.json size=3582105 sha256=cd07cdb845ee3eb75bcf0efff56fc252e8291c78d5c116c21bd75684c4cf0745
safety=pass mirror_executable_count=0 duplicate_keys=0
dist=/workspace/output/webstudio-ops-dashboard-static files=181
npm notice
npm notice New major version of npm available! 10.8.2 -> 11.16.0
npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.16.0
npm notice To update run: npm install -g npm@11.16.0
npm notice

```

## Smoke tail
```text

> webstudio-ops-dashboard@0.1.0 smoke
> python3 scripts/smoke_check.py

SMOKE PASS
generated_at=2026-06-02T10:23:16Z
kanban_task_total=852
wf_completed=144
routes=overview,work-factory,owner-command-center,order-builder,kanban,production,demo-products,agent-workflow,capabilities,motion-factory,intake-orders,delivery,real-clients,premium-factory,premium-generator,premium-factory-v34,generated-demo-site-v35,lead-capture-demo,d3-intake,owner-feedback,clients,sales-pack,morning-desk,approvals,supabase-memory,bot-activity,health,artifacts,marathon,audit
executable_mirror_count=0
npm notice
npm notice New major version of npm available! 10.8.2 -> 11.16.0
npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.16.0
npm notice To update run: npm install -g npm@11.16.0
npm notice

```
