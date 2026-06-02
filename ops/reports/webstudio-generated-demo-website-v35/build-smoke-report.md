# V3.5 Build / Smoke Report

## npm run build
PASS

```text

> webstudio-ops-dashboard@0.1.0 build
> python3 scripts/build_snapshot.py --dist /workspace/output/webstudio-ops-dashboard-static

snapshot=/workspace/tmp/webstudio-ops-dashboard-v35/public/data/webstudio-control-plane-state.json size=3568208 sha256=ce62348f04cc189e032e243fac9519e941715086f42b65617d8d1242d1d04671
canonical=/workspace/output/webstudio-control-plane-state.json size=3568208 sha256=ce62348f04cc189e032e243fac9519e941715086f42b65617d8d1242d1d04671
safety=pass mirror_executable_count=0 duplicate_keys=0
dist=/workspace/output/webstudio-ops-dashboard-static files=174
npm notice
npm notice New major version of npm available! 10.8.2 -> 11.16.0
npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.16.0
npm notice To update run: npm install -g npm@11.16.0
npm notice

```

## npm run smoke
PASS

```text

> webstudio-ops-dashboard@0.1.0 smoke
> python3 scripts/smoke_check.py

SMOKE PASS
generated_at=2026-06-02T07:54:43Z
kanban_task_total=852
wf_completed=144
routes=overview,work-factory,owner-command-center,order-builder,kanban,production,demo-products,agent-workflow,capabilities,motion-factory,intake-orders,delivery,real-clients,premium-factory,premium-generator,premium-factory-v34,generated-demo-site-v35,d3-intake,owner-feedback,clients,sales-pack,morning-desk,approvals,supabase-memory,bot-activity,health,artifacts,marathon,audit
executable_mirror_count=0
npm notice
npm notice New major version of npm available! 10.8.2 -> 11.16.0
npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.16.0
npm notice To update run: npm install -g npm@11.16.0
npm notice

```

## Local static route smoke
PASS

```json
{
  "status": "PASS",
  "route_http": 200,
  "markers": "PASS"
}
```

## Changed-files secret scan
```text
secret_scan=PASS

```

## git diff --check
PASS: no whitespace errors.
