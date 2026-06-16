# WebStudio V2.4 — Migration from VPS Plan

## Can move off VPS now

- Static frontend serving: GitHub Pages already serves `https://pltnv123.github.io/webstudio-ops-dashboard/`.
- Build/deploy gate: GitHub Actions can build, smoke, upload, and deploy the static artifact.
- Deployment evidence: GitHub Actions run URLs and Git commits can replace local-only proof.
- Operational status rows: Supabase `webstudio_ops_status` can store durable current state.
- Job metadata: Supabase `webstudio_jobs` can store non-sensitive queue/control metadata.
- Artifact index: Supabase `webstudio_artifacts` can store paths and metadata, not raw secrets/logs.
- Memory/state summaries: Supabase `webstudio_memory_index` can store durable summaries and pointers.

## Still depends on Hermes/VPS

- Telegram/operator interaction through Hermes gateway.
- Autonomous worker orchestration, local tool execution, hfinalize/QMD/snapshot pipeline.
- Host-side browser/screenshot/preview bridges when GitHub-hosted runners do not cover them.
- Any private credentials or service-role operations that must not run client-side.
- Supabase writes that require controlled backend/service-role context.

## Must be backed up before shutting anything down

- `/workspace/output/` reports and finalizer artifacts.
- `/workspace/runtime/` host-health snapshots, last-auto-snapshot marker, snapshot request state.
- Hermes profile/config/skills/plugins/memory under `.hermes` excluding secrets in public artifacts.
- GitHub repo branch state and all open/merged PR metadata.
- Supabase schema, RLS policies, table row export for operational tables.
- QMD index/source documents if they are needed beyond Git-tracked reports.
- Any non-Git media/build artifacts that are referenced by GitHub/Supabase rows.

## Recommended next migration steps

1. Align default branch with delivery/base branch after explicit approval.
2. Keep GitHub Pages workflow on the durable branch, not a deleted feature branch.
3. Add a scheduled GitHub Actions health/status report only after confirming no secrets are needed.
4. Move read-only dashboard state export into GitHub Actions where possible.
5. Keep write-side orchestration on Hermes/VPS until a secure serverless writer exists.
