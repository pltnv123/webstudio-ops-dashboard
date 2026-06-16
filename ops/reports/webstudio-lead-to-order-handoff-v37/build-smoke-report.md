# WebStudio V3.7 Build/Smoke Report

Status: PASS

## Commands
- `npm run build`: PASS
- `npm run smoke`: PASS
- `git diff --check`: PASS
- local static smoke `/lead-to-order-handoff/`: PASS
- changed diff secret scan: PASS

## Raw log
```text
## npm run build

> webstudio-ops-dashboard@0.1.0 build
> python3 scripts/build_snapshot.py --dist /workspace/output/webstudio-ops-dashboard-static

snapshot=/workspace/tmp/webstudio-ops-dashboard-pr/public/data/webstudio-control-plane-state.json size=3588099 sha256=9ee75a25b2e8f9748220827f948db2a7348adb0c0329b25df5a2268c23218bb0
canonical=/workspace/output/webstudio-control-plane-state.json size=3588099 sha256=9ee75a25b2e8f9748220827f948db2a7348adb0c0329b25df5a2268c23218bb0
safety=pass mirror_executable_count=0 duplicate_keys=0
dist=/workspace/output/webstudio-ops-dashboard-static files=188
npm notice
npm notice New major version of npm available! 10.8.2 -> 11.16.0
npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.16.0
npm notice To update run: npm install -g npm@11.16.0
npm notice
## npm run smoke

> webstudio-ops-dashboard@0.1.0 smoke
> python3 scripts/smoke_check.py

SMOKE PASS
generated_at=2026-06-02T11:39:18Z
kanban_task_total=852
wf_completed=144
routes=overview,work-factory,owner-command-center,order-builder,kanban,production,demo-products,agent-workflow,capabilities,motion-factory,intake-orders,delivery,real-clients,premium-factory,premium-generator,premium-factory-v34,generated-demo-site-v35,lead-capture-demo,lead-to-order-handoff,d3-intake,owner-feedback,clients,sales-pack,morning-desk,approvals,supabase-memory,bot-activity,health,artifacts,marathon,audit
executable_mirror_count=0
## git diff --check
## local static smoke /lead-to-order-handoff/
{
  "status": "PASS",
  "path": "/workspace/output/webstudio-ops-dashboard-static/lead-to-order-handoff/index.html",
  "sha256": "987cc12a4cf7621b484fff417cd775fa9b91744bed56d3fa10b2f7ead89d1144",
  "markers": {
    "lead-to-order-handoff-v37": true,
    "demo lead payload": true,
    "qualification preview": true,
    "order-builder handoff": true,
    "D1 website": true,
    "D2 AI-intake bot": true,
    "D3 automation": true
  },
  "bytes": 3047756
}
## changed diff secret scan
PASS

```
