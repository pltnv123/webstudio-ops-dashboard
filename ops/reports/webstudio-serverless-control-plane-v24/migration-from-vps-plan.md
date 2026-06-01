# Migration From VPS Plan

Generated: `2026-06-01T02:02:32.890418+00:00`

Can move off VPS now:
- Static frontend hosting: already on GitHub Pages.
- Build/deploy execution for the frontend: GitHub Actions latest deployment is successful.
- Operational current-state rows: Supabase `webstudio_ops_status` is writable and queryable.
- Sanitized audit reports: GitHub repo path `ops/reports/webstudio-serverless-control-plane-v24/`.
- Job metadata index: Supabase `webstudio_jobs` can hold durable non-sensitive job state.

Still depends on Hermes/VPS:
- Agent execution/orchestration and reasoning loops.
- Browser/curl validation initiated by Hermes.
- QMD/local workspace indexing and finalization reports.
- Any local-only artifacts not yet mirrored to GitHub/Supabase.
- Gateway/Telegram runtime and current Hermes operational memory.

Back up before shutting anything down:
- `/workspace/output` reports and finalizer artifacts.
- `/workspace/runtime` health snapshots, autonomy state, snapshot requests, and last-auto-snapshot files.
- Canonical project working trees and unpushed branches.
- Hermes profiles, skills, memories, cron jobs, and plugin configs.
- Supabase migration SQL/rollback SQL and verified table schema snapshots.
- Git remotes/branches not represented on GitHub default branch.
- Any local `.env`/secret material separately through secure secret backup; never commit it.

Branch alignment required before stronger migration:
- PR #5 is merged into `webstudio/product-build-v31`, not default `main`.
- Default `main` currently diverges and does not contain merge commit `3336f2e73799a8d77c9fff2b10f372fff102bbb7`.
- Decide whether to make the product branch the default, merge/cherry-pick into main, or keep Pages deploying from the product branch with documented intent.
