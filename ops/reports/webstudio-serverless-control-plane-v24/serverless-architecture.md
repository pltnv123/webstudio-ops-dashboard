# WebStudio V2.4 — Serverless Control Plane Architecture

Status: BASELINE_READY_WITH_DEFAULT_BRANCH_RISK

## Control plane baseline

WebStudio now has a durable serverless control-plane path:

1. **GitHub Pages frontend**
   - Public URL: https://pltnv123.github.io/webstudio-ops-dashboard/
   - Static dashboard is served from GitHub Pages.
   - Runtime dependency on the VPS is removed for read-only dashboard delivery.

2. **GitHub Actions build/deploy**
   - Workflow: `.github/workflows/pages.yml`
   - Build source: repository checkout
   - Build output: `dist`
   - Smoke mode: `WEBSTUDIO_CI=1`
   - Deploy target: GitHub Pages artifact

3. **Supabase operational state**
   - Project ref: `ebqupwyyafvnmhakfwet`
   - Operational tables verified:
     - `webstudio_ops_status`
     - `webstudio_jobs`
     - `webstudio_artifacts`
     - `webstudio_memory_index`
   - Intended use: durable status, jobs, artifact index, memory/state summaries.
   - Constraint: service-role/backend writes only; no secrets in client bundle.

4. **GitHub repo as audit ledger**
   - Sanitized reports live under `ops/reports/`.
   - Git commits and Actions runs form immutable public audit evidence.
   - Sensitive runtime state stays out of Git.

## Important branch note

- GitHub default branch: `main` at `1dd2deffdccf556c66212297130584abae2c58b3`.
- Delivery/base branch: `webstudio/product-build-v31` at `3336f2e73799a8d77c9fff2b10f372fff102bbb7`.
- PR #5 merge commit: `3336f2e73799a8d77c9fff2b10f372fff102bbb7`.
- The delivery/base branch contains PR #5; `main` does not currently contain this merge commit.
- For a cleaner serverless posture, either make `webstudio/product-build-v31` the default branch or fast-forward/merge it into `main` after explicit owner approval.
