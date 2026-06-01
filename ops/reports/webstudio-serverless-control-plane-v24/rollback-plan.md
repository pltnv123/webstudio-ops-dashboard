# Rollback Plan

Generated: `2026-06-01T02:02:32.890418+00:00`

GitHub Pages rollback:
1. Identify last known good deployment SHA/run from GitHub Actions or deployments.
   - Current latest successful deploy SHA: `150666666fe41aa2c23146fd475ce559ea375c79`.
   - PR #5 merge commit: `3336f2e73799a8d77c9fff2b10f372fff102bbb7`.
2. Preferred rollback: revert the bad commit or push a new corrective commit; do not force-push.
3. If Pages workflow supports manual dispatch, run it against the chosen good ref.
4. Verify with:
   - `curl -I https://pltnv123.github.io/webstudio-ops-dashboard/`
   - GitHub deployment status for `github-pages`.

Supabase state rollback:
1. Do not delete operational rows by default.
2. Write a new `webstudio_ops_status` row marking the previous state as restored or current.
3. If bad rows were added, mark superseded in notes/status rather than deleting.
4. For table-level restore, export current table snapshots first, then apply approved restore SQL only after owner confirmation.

Hermes/VPS restart if needed:
- This task did **not** restart gateway/systemd and did not require it.
- If Hermes runtime needs recovery, use the approved path only:
  - `hermes-gateway-apply-restart --force-post-turn --delay 300`
- Do not rotate secrets, delete VPS data, or force-reset services as part of rollback.
