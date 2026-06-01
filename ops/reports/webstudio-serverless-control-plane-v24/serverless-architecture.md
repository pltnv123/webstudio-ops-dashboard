# Serverless Architecture Baseline

Generated: `2026-06-01T02:02:32.890418+00:00`

Target state: GitHub + Supabase become the durable control plane; VPS/Hermes remains an execution worker, not the source of truth.

Components:
- **GitHub Pages frontend**
  - Public operator/dashboard frontend at `https://pltnv123.github.io/webstudio-ops-dashboard/`.
  - Static hosting, CDN, HTTPS enforced.
  - Can be verified with `curl` and browser smoke without VPS.

- **GitHub Actions build/deploy**
  - Builds static artifact and deploys to GitHub Pages.
  - Latest successful deploy run: `26717721916`.
  - GitHub deployment object records environment status and job links.

- **Supabase ops/memory/state**
  - `webstudio_ops_status`: current/heartbeat state rows.
  - `webstudio_jobs`: durable job metadata.
  - `webstudio_artifacts`: report/artifact index; currently empty and ready for use.
  - `webstudio_memory_index`: sanitized durable memory pointers; currently empty and ready for use.
  - RLS is enabled on operational tables; backend/service-role only design remains correct.

- **GitHub repo as audit ledger**
  - Sanitized reports under `ops/reports/...` provide immutable-ish reviewed history.
  - Commits provide provenance for serverless config and operational decisions.
  - Actions logs and deployments provide deploy provenance.

Baseline control flow:
1. Operator/frontend reads published static UI from GitHub Pages.
2. Durable operational state is stored in Supabase rows, not local VPS files.
3. Reports/config live in GitHub under sanitized paths.
4. Hermes/VPS can still generate reports, run advanced validation, and write approved ops rows, but should not be the only copy of state.
