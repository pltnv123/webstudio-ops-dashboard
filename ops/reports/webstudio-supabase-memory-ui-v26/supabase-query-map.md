# Supabase Query Map — WebStudio V2.6

## Source mode

`static_snapshot_from_supabase_mcp`

No Supabase credentials are embedded into the browser. The dashboard reads the generated `supabase_memory` state object.

## Tables

- `webstudio_ops_status`: latest operational rows, delivery loop status, commit, deploy target, heartbeat.
- `webstudio_jobs`: latest job rows and bot activity summary.
- `webstudio_artifacts`: latest artifact rows; current snapshot is empty.
- `webstudio_memory_index`: memory index rows; current snapshot is empty.

## Sanitization

- Raw secrets, `.env`, tokens, service-role keys, auth logs, and private payload bodies are not included.
- Job payloads are reduced to `payload_summary` with repo/branch/commit/PR-level metadata only.
- Notes are shortened operational summaries.
