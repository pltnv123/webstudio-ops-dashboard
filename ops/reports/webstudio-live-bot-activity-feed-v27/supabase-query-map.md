# Supabase Query Map — WebStudio V2.7

## Read-only source tables

- `webstudio_ops_status`: latest heartbeat/status rows, component, version, status, commit, target, notes summary, created_at.
- `webstudio_jobs`: latest job rows, title, status, priority, sanitized payload summary, PR/repo links, timestamps.
- `webstudio_artifacts`: latest artifact rows; current snapshot empty state is supported.
- `webstudio_memory_index`: latest memory index rows; current snapshot empty state is supported.

## Snapshot mode

`static_sanitized_supabase_mcp_and_github_cli_snapshot`

The build-time snapshot also includes read-only GitHub CLI data for recent commits and Pages workflow runs.

## Excluded

- Supabase credentials
- GitHub credentials
- service-role keys
- `.env` values
- raw private memory
- raw prompt/log payload bodies
