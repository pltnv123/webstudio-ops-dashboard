# WebStudio V2.5 — Supabase Operational Policy

## Allowed operational tables

Current operational baseline tables:

- `webstudio_ops_status` — component/version/status rows and delivery state.
- `webstudio_jobs` — future autonomous job metadata/state.
- `webstudio_artifacts` — future artifact index and references.
- `webstudio_memory_index` — future memory/evidence index.

## Allowed writes

- Heartbeat rows.
- Job/status rows.
- Artifact references that point to sanitized GitHub or `/output` evidence.
- Operational notes that contain no secrets and no raw credentials.

## Migration rules

Any schema change requires:

- read-only inspection first;
- migration SQL;
- rollback SQL;
- affected tables/policies/functions/indexes;
- RLS/security impact;
- verification queries;
- explicit owner approval before destructive or structural writes.

## Hard rules

- No destructive Supabase changes without explicit owner approval.
- No production data deletion.
- No service-role credential exposure.
- No secrets in `notes`, JSON metadata, artifact names, URLs, or logs.
- Client-side GitHub Pages frontend must not embed service-role credentials.

## Timeout handling

If Supabase MCP write/read times out:

- do not claim the row was written;
- save state/report/continuation artifacts;
- mark final status `PARTIAL` or `BLOCKED` depending on scope;
- retry later from the saved continuation prompt.
