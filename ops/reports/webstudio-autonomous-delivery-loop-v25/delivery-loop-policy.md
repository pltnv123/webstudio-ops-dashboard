# WebStudio V2.5 — Autonomous Delivery Loop Policy

Status: BASELINE POLICY

## Purpose

The normal WebStudio delivery loop makes GitHub, GitHub Actions, GitHub Pages, Supabase operational rows, and sanitized report artifacts the durable control plane for future work.

## Canonical loop

1. Freeze current state:
   - repo, default branch, commit, Pages URL, latest workflow run;
   - Supabase latest operational rows;
   - output root and report paths.
2. Create a local execution ledger for every important step:
   - `final-report.md`;
   - `state.json`;
   - `events.jsonl`;
   - `validation.md`;
   - task-specific policy/proof files.
3. For every important step, push sanitized evidence to GitHub under an approved path:
   - normal policy/report path: `ops/reports/<task-id>/`;
   - no secrets, credentials, `.env`, raw tokens, private keys, or private host values;
   - no generated runtime snapshots unless explicitly approved and redacted.
4. For every production code change, run gates before deploy acceptance:
   - local build;
   - smoke check;
   - changed-files secret scan;
   - `git diff --check`;
   - allowlist check for changed paths.
5. Deployment acceptance requires successful GitHub Actions on the durable default branch.
6. Deployed acceptance requires GitHub Pages URL smoke with HTTP 200.
7. After every important step, write a Supabase operational state row:
   - component;
   - version;
   - status;
   - repo path;
   - commit hash;
   - deployment target;
   - sanitized notes.
8. Before final answer, run `hfinalize` and include QMD/snapshot evidence.

## Durable sources of truth

- Default branch: `webstudio/product-build-v31`.
- Public deployment: GitHub Pages via GitHub Actions.
- Operational state: Supabase `webstudio_ops_status` and companion ops tables.
- Evidence ledger: `ops/reports/...` in GitHub plus `/workspace/output/...` local artifacts.

## Finishline rule

A delivery step is not complete until evidence exists, checks have run, Supabase state is updated when in scope, and the final response is `PASS`, `PARTIAL`, or `BLOCKED`.
