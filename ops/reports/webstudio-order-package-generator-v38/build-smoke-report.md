# WebStudio V3.8 Build/Smoke Report

Status: PASS

## Commands
- `npm run build`: PASS
- `npm run smoke`: PASS
- `git diff --check`: PASS
- local static smoke `/order-package-generator/`: PASS
- changed diff redaction scan: PASS

## Raw log
```text
## npm run build

> webstudio-ops-dashboard@0.1.0 build
> python3 scripts/build_snapshot.py --dist /workspace/output/webstudio-ops-dashboard-static

snapshot=/workspace/tmp/webstudio-ops-dashboard-pr/public/data/webstudio-control-plane-state.json size=3590682 sha256=ac02bb760dc866f6a65f71f3ec43e7040abfce197f4fe67f482114eaed433923
canonical=/workspace/output/webstudio-control-plane-state.json size=3590682 sha256=ac02bb760dc866f6a65f71f3ec43e7040abfce197f4fe67f482114eaed433923
safety=pass mirror_executable_count=0 duplicate_keys=0
dist=/workspace/output/webstudio-ops-dashboard-static files=195
npm notice
npm notice New major version of npm available! 10.8.2 -> 11.16.0
npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.16.0
npm notice To update run: npm install -g npm@11.16.0
npm notice
## npm run smoke

> webstudio-ops-dashboard@0.1.0 smoke
> python3 scripts/smoke_check.py

SMOKE PASS
generated_at=2026-06-03T00:15:36Z
kanban_task_total=852
wf_completed=144
routes=overview,work-factory,owner-command-center,order-builder,kanban,production,demo-products,agent-workflow,capabilities,motion-factory,intake-orders,delivery,real-clients,premium-factory,premium-generator,premium-factory-v34,generated-demo-site-v35,lead-capture-demo,lead-to-order-handoff,order-package-generator,d3-intake,owner-feedback,clients,sales-pack,morning-desk,approvals,supabase-memory,bot-activity,health,artifacts,marathon,audit
executable_mirror_count=0
npm notice
npm notice New major version of npm available! 10.8.2 -> 11.16.0
npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.16.0
npm notice To update run: npm install -g npm@11.16.0
npm notice
## git diff --check
## local static smoke /order-package-generator/
{
  "status": "PASS",
  "path": "/workspace/output/webstudio-ops-dashboard-static/order-package-generator/index.html",
  "sha256": "1886b2102c741a2c1ad28ec93efa73e53fa7ab42cf27f4d57657c01ae4b6d491",
  "markers": {
    "order-package-generator-v38": true,
    "generated sitemap": true,
    "page briefs": true,
    "SEO checklist": true,
    "QA checklist": true,
    "delivery checklist": true
  },
  "bytes": 3049328
}
## changed diff redaction scan
PASS

```
