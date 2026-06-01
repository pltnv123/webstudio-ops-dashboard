# Supabase Control Plane — WebStudio V2.4

## Verified operational tables

- `webstudio_ops_status` — operational heartbeat/current-state rows.
- `webstudio_jobs` — operational job metadata.
- `webstudio_artifacts` — artifact index for non-sensitive metadata/path pointers.
- `webstudio_memory_index` — operational memory summaries and non-sensitive pointers.

## Latest observed status

- Latest known production row before V2.4: `webstudio-production-autopilot`, version `v2.3e`, status `DEPLOYED`.
- Additional V2.4 rows may exist from retry/baseline attempts; the final row for this run should supersede previous rows by created_at.

## Security posture

- RLS is enabled on operational tables.
- Tables are intended for backend/service-role operations.
- Do not store raw secrets, `.env`, auth tokens, private keys, database passwords, or raw tool logs.
- GitHub Pages frontend must not embed service-role keys.

## V2.4 row intent

A new row is written with:
- component: `webstudio-serverless-control-plane`
- version: `v2.4`
- status: `PARTIAL` until default branch alignment is resolved; otherwise `BASELINE_READY`
- deployment target: GitHub Pages URL
- notes: concise non-sensitive baseline summary
