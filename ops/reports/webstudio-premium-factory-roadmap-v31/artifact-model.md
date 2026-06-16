# Artifact Model v3.1

Supabase ops/artifact payloads should store only sanitized metadata: version, component, route, status, commit, generated_at, report paths, brief hash, page list, QA summary, approval gates.

GitHub artifacts: code route, static snapshot JSON, reports under `ops/reports/<phase>/`, build/smoke evidence, deployment evidence.
