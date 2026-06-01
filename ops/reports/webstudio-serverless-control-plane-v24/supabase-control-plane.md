# Supabase Control Plane

Generated: `2026-06-01T02:02:32.890418+00:00`

Status: **PARTIAL row written**

Project ref: `ebqupwyyafvnmhakfwet`

Operational tables verified in `public` schema:
- `webstudio_ops_status`: exists, RLS enabled, rows observed: `5+`
- `webstudio_jobs`: exists, RLS enabled, rows observed: `3`
- `webstudio_artifacts`: exists, RLS enabled, rows observed: `0`
- `webstudio_memory_index`: exists, RLS enabled, rows observed: `0`

Latest V2.4 status row written:
- id: `b5316f1b-1148-491a-ab0d-698166ea3116`
- component: `webstudio-serverless-control-plane`
- version: `v2.4`
- status: `PARTIAL`
- repo_path: `https://github.com/pltnv123/webstudio-ops-dashboard`
- git_commit: `3336f2e73799a8d77c9fff2b10f372fff102bbb7`
- deployment_target: `https://pltnv123.github.io/webstudio-ops-dashboard/`
- qmd_status: `PENDING_FINALIZER`
- host_health: `not_checked_no_gateway_restart`

Reason for `PARTIAL` instead of `BASELINE_READY`:
- Pages and latest GitHub Actions deploy are healthy.
- Supabase operational tables are present.
- But PR #5 merge commit is not in default branch `main`; branch topology must be aligned before calling the control plane baseline fully ready.

Latest pre-existing relevant row:
- `webstudio-production-autopilot` / `v2.3e` / `DEPLOYED` at commit `150666666fe41aa2c23146fd475ce559ea375c79`.
