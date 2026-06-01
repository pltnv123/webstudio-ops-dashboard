# WebStudio V2.4 — Rollback Plan

## Return GitHub Pages to previous commit

1. Identify the known-good commit from GitHub Actions or Git history.
2. Create a rollback branch from the delivery/base branch.
3. Revert the serverless/report/config commit with `git revert <commit>` or restore the previous workflow/report files.
4. Push the rollback branch and run GitHub Actions.
5. Verify Pages HTTP 200 and smoke routes.
6. Merge rollback only after checks are green.

For the current PR #5 baseline:
- Merge commit: `3336f2e73799a8d77c9fff2b10f372fff102bbb7`
- Delivery/base branch head before V2.4 report commit: `3336f2e73799a8d77c9fff2b10f372fff102bbb7`

## Restore Supabase state

1. Do not delete existing rows.
2. Insert a new status row marking rollback target and reason.
3. If a bad row was written, supersede it with a newer status row instead of editing/deleting history.
4. For table-level restore, export current operational tables first, then apply approved restore SQL only after owner approval.
5. Verify with read-only select queries.

## Restart Hermes if needed

Do not restart Hermes/gateway from this workflow. If runtime recovery is required, use the approved Hermes operational runbook and the owner-approved restart path only. Current task explicitly forbids gateway/systemd restart.

## Emergency safe mode

- Keep GitHub Pages serving last successful static artifact.
- Keep Supabase rows append-only.
- Disable new GitHub Actions only by reverting workflow config in Git, not by deleting repository state.
- Keep VPS data intact until backup verification is complete.
