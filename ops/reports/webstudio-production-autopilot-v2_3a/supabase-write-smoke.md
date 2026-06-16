# Supabase write smoke — WebStudio Production Autopilot V2.3A

Status: PASS
Project ref: `ebqupwyyafvnmhakfwet`

## MCP operations
- `mcp_supabase_list_tables`: PASS
- Missing ops tables detected before migration: `webstudio_ops_status`, `webstudio_jobs`, `webstudio_artifacts`, `webstudio_memory_index`
- `mcp_supabase_apply_migration`: PASS (`webstudio_production_autopilot_v2_3a_ops_tables`)
- `mcp_supabase_execute_sql` heartbeat insert: PASS
- Post-write table listing: PASS

## Tables now present
- `public.webstudio_ops_status` — rows: 1, RLS enabled
- `public.webstudio_jobs` — rows: 0, RLS enabled
- `public.webstudio_artifacts` — rows: 0, RLS enabled
- `public.webstudio_memory_index` — rows: 0, RLS enabled

## Heartbeat row
- table: `public.webstudio_ops_status`
- id: `98f7c16c-b3a3-4070-84c5-186cc84ecabc`
- component: `webstudio-production-autopilot`
- status: `ACTIVE_HEALTHY`
- version: `v2.3a`
- repo_path: `/home/hermes/workspace/projects/webstudio-ops-dashboard`
- deployment_target: `owner_preview:http://localhost:4173`

## Scope guard
- No Git push.
- No deploy.
- No build/smoke.
- No browser QA.
- No Hermes gateway restart.
- No systemd restart.
- No officebot path used.
- No unrelated DB writes.
