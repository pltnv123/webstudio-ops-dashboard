## node --check src/app.js
## python py_compile build_snapshot
## npm run build

> webstudio-ops-dashboard@0.1.0 build
> python3 scripts/build_snapshot.py --dist /workspace/output/webstudio-ops-dashboard-static

snapshot=/workspace/projects/webstudio-ops-dashboard.gitcheck/public/data/webstudio-control-plane-state.json size=3635033 sha256=c0a210d8e5f8bc27b78cb98a5e10e68348f59243c6e4a50504b949b0dcfe8da3
canonical=/workspace/output/webstudio-control-plane-state.json size=3635033 sha256=c0a210d8e5f8bc27b78cb98a5e10e68348f59243c6e4a50504b949b0dcfe8da3
safety=pass mirror_executable_count=0 duplicate_keys=0
dist=/workspace/output/webstudio-ops-dashboard-static files=265
## npm run smoke

> webstudio-ops-dashboard@0.1.0 smoke
> python3 scripts/smoke_check.py

SMOKE PASS
generated_at=2026-06-04T10:15:45Z
kanban_task_total=852
wf_completed=144
routes=overview,work-factory,owner-command-center,order-builder,kanban,production,demo-products,agent-workflow,capabilities,motion-factory,intake-orders,delivery,real-clients,premium-factory,premium-generator,premium-factory-v34,generated-demo-site-v35,lead-capture-demo,lead-to-order-handoff,order-package-generator,website-page-builder,one-click-demo-assembly,client-handoff-pack,handoff-review-matrix,revision-request-demo,webstudio-showcase,pricing-packages,route-health,morning-summary,d3-intake,owner-feedback,clients,sales-pack,morning-desk,approvals,supabase-memory,bot-activity,health,artifacts,marathon,audit
executable_mirror_count=0
