# Build/Smoke Report — V6.5

Status: PASS
Updated: 2026-06-07T22:21:39Z

Commands:
- `node --check src/app.js` — PASS
- `python3 -m py_compile scripts/build_snapshot.py scripts/smoke_check.py` — PASS
- `npm run build` — PASS
- `npm run smoke` — PASS
- `git diff --check` — PASS
- changed-files secret-pattern scan — PASS

Notes:
- Build used last valid snapshot fallback because live candidate had `kanban.task_total is zero while a last valid snapshot exists`.
- Static dist still generated and route marker smoke passed.

Log: `/workspace/output/webstudio-delivery-timeline-milestones-v65/checks.log`
