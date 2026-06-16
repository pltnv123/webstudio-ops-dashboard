
> webstudio-ops-dashboard@0.1.0 build
> python3 scripts/build_snapshot.py --dist /workspace/output/webstudio-ops-dashboard-static

snapshot=/workspace/projects/webstudio-ops-dashboard/public/data/webstudio-control-plane-state.json size=3661200 sha256=fb009b43cee614f5318b4ca22483dfdd66ba9aa219e5aa845444028c615ca08e
canonical=/workspace/output/webstudio-control-plane-state.json size=3661200 sha256=fb009b43cee614f5318b4ca22483dfdd66ba9aa219e5aa845444028c615ca08e
snapshot_publish=FALLBACK warning=Live snapshot rejected; published last valid snapshot fallback instead. fallback_source=/workspace/output/webstudio-control-plane-state.json
candidate_errors=["kanban.task_total is zero while a last valid snapshot exists"]
safety=pass mirror_executable_count=0 duplicate_keys=0
dist=/workspace/output/webstudio-ops-dashboard-static files=107

> webstudio-ops-dashboard@0.1.0 smoke
> python3 scripts/smoke_check.py

SMOKE PASS
generated_at=2026-06-09T10:42:15Z
kanban_task_total=852
wf_completed=144
routes=overview,work-factory,premium-factory,kanban,production,d3-intake,owner-feedback,clients,sales-pack,real-assets,proposal-quote,integration-plan,approvals,health,artifacts,marathon,audit
executable_mirror_count=0
