# WebStudio V2.5 — GitHub Policy

## Repository

- Repo: `pltnv123/webstudio-ops-dashboard`.
- Durable default branch: `webstudio/product-build-v31`.
- GitHub Pages deployment branch/workflow must remain aligned to the durable default branch.

## Hard rules

- No force push.
- No branch deletion without explicit owner approval.
- No direct pushes to unrelated branches.
- No `.env`, credentials, tokens, private keys, service-role keys, raw auth logs, or secret-bearing host paths in commits.
- No public deployment of broken code.
- No officebot path for production WebStudio work.

## Branch/PR rules

- Docs/report-only updates may be committed directly to the durable default branch when explicitly approved and allowlisted.
- Production code changes require scoped branch/PR or explicitly approved direct update to the durable branch.
- Workflow changes require extra care: verify trigger branch, run status, and deploy result.
- Every push must verify remote branch SHA equals intended local SHA.

## Evidence rules

- Use `git status --porcelain=v1 -uall` before staging.
- Enforce path allowlists before commit.
- Run `git diff --check`.
- Run a changed-files secret scan.
- Verify required report files exist at the pushed commit.
