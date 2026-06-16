## node --check src/app.js
## python3 -m py_compile scripts/build_snapshot.py
## npm run build

> webstudio-ops-dashboard@0.1.0 build
> python3 scripts/build_snapshot.py --dist /workspace/output/webstudio-ops-dashboard-static

snapshot=/workspace/projects/webstudio-ops-dashboard.gitcheck/public/data/webstudio-control-plane-state.json size=3636354 sha256=249c7b7821caf07eab7fa0b076f1dbf5aee27fa714b81d7cecd19b5d1f0a086b
canonical=/workspace/output/webstudio-control-plane-state.json size=3636354 sha256=249c7b7821caf07eab7fa0b076f1dbf5aee27fa714b81d7cecd19b5d1f0a086b
safety=pass mirror_executable_count=0 duplicate_keys=0
dist=/workspace/output/webstudio-ops-dashboard-static files=272
npm notice
npm notice New major version of npm available! 10.8.2 -> 11.16.0
npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.16.0
npm notice To update run: npm install -g npm@11.16.0
npm notice
## npm run smoke

> webstudio-ops-dashboard@0.1.0 smoke
> python3 scripts/smoke_check.py

SMOKE PASS
generated_at=2026-06-04T11:04:17Z
kanban_task_total=852
wf_completed=144
routes=overview,work-factory,owner-command-center,order-builder,kanban,production,demo-products,agent-workflow,capabilities,motion-factory,intake-orders,delivery,real-clients,premium-factory,premium-generator,premium-factory-v34,generated-demo-site-v35,lead-capture-demo,lead-to-order-handoff,order-package-generator,website-page-builder,one-click-demo-assembly,client-handoff-pack,handoff-review-matrix,revision-request-demo,webstudio-showcase,pricing-packages,route-health,morning-summary,d3-intake,owner-feedback,clients,sales-pack,morning-desk,approvals,supabase-memory,bot-activity,health,artifacts,marathon,audit
executable_mirror_count=0
npm notice
npm notice New major version of npm available! 10.8.2 -> 11.16.0
npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.16.0
npm notice To update run: npm install -g npm@11.16.0
npm notice
